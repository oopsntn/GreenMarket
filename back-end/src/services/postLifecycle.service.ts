import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { db } from "../config/db.ts";
import { posts, type Post } from "../models/schema/index.ts";
import { adminWebSettingsService, type AdminWebSettingsState } from "./adminWebSettings.service.ts";

const TRASH_META_PREFIX = "__TRASH_META__:";

type TrashMeta = {
  previousStatus: string;
  previousPublished: boolean;
  previousPublishedAt: string | null;
  previousReason: string | null;
};

const encodeTrashMeta = (meta: TrashMeta) =>
  `${TRASH_META_PREFIX}${Buffer.from(JSON.stringify(meta), "utf8").toString("base64")}`;

const decodeTrashMeta = (value: string | null | undefined): TrashMeta | null => {
  if (!value?.startsWith(TRASH_META_PREFIX)) {
    return null;
  }

  try {
    const payload = value.slice(TRASH_META_PREFIX.length);
    const raw = Buffer.from(payload, "base64").toString("utf8");
    const parsed = JSON.parse(raw) as Partial<TrashMeta>;

    if (!parsed.previousStatus?.trim()) {
      return null;
    }

    return {
      previousStatus: parsed.previousStatus.trim(),
      previousPublished: Boolean(parsed.previousPublished),
      previousPublishedAt: parsed.previousPublishedAt ?? null,
      previousReason: parsed.previousReason ?? null,
    };
  } catch {
    return null;
  }
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const resolveExpiryAnchor = (post: Pick<Post, "postPublishedAt" | "postSubmittedAt" | "postCreatedAt">) =>
  post.postPublishedAt ?? post.postSubmittedAt ?? post.postCreatedAt ?? null;

const isShopManagedPost = (post: Pick<Post, "postShopId">) => post.postShopId !== null;

export const postLifecycleService = {
  async syncAutoExpiredPosts(settings?: AdminWebSettingsState) {
    const effectiveSettings = settings ?? (await adminWebSettingsService.getSettings());
    if (!effectiveSettings.postLifecycle.allowAutoExpire) {
      return 0;
    }

    const expiryDays = Math.max(1, Number(effectiveSettings.postLifecycle.postExpiryDays || 0));
    const cutoff = addDays(new Date(), -expiryDays);

    const expiredRows = await db
      .update(posts)
      .set({
        postStatus: "expired",
        postPublished: false,
        postUpdatedAt: new Date(),
      })
      .where(
        and(
          eq(posts.postStatus, "approved"),
          eq(posts.postPublished, true),
          isNull(posts.postDeletedAt),
          isNull(posts.postShopId),
          lte(
            sql`COALESCE(${posts.postPublishedAt}, ${posts.postSubmittedAt}, ${posts.postCreatedAt})`,
            cutoff,
          ),
        ),
      )
      .returning({ postId: posts.postId });

    return expiredRows.length;
  },

  buildUserTrashPayload(post: Pick<Post, "postStatus" | "postPublished" | "postPublishedAt" | "postRejectedReason">) {
    return encodeTrashMeta({
      previousStatus: post.postStatus,
      previousPublished: Boolean(post.postPublished),
      previousPublishedAt: post.postPublishedAt ? post.postPublishedAt.toISOString() : null,
      previousReason: post.postRejectedReason ?? null,
    });
  },

  getRestoreMeta(post: Pick<Post, "postDeletedAt" | "postRejectedReason" | "postStatus">, settings: AdminWebSettingsState) {
    if (post.postStatus !== "hidden" || !post.postDeletedAt) {
      return {
        canRestore: false,
        restoreUntil: null as string | null,
        trashMeta: null as TrashMeta | null,
      };
    }

    const trashMeta = decodeTrashMeta(post.postRejectedReason);
    if (!trashMeta) {
      return {
        canRestore: false,
        restoreUntil: null,
        trashMeta: null,
      };
    }

    const restoreUntil = addDays(
      post.postDeletedAt,
      Math.max(1, Number(settings.postLifecycle.restoreWindowDays || 0)),
    );

    return {
      canRestore: restoreUntil.getTime() >= Date.now(),
      restoreUntil: restoreUntil.toISOString(),
      trashMeta,
    };
  },

  getPostLifecycleMeta(
    post: Pick<
      Post,
      | "postStatus"
      | "postDeletedAt"
      | "postRejectedReason"
      | "postPublishedAt"
      | "postSubmittedAt"
      | "postCreatedAt"
      | "postShopId"
    >,
    settings: AdminWebSettingsState,
  ) {
    const restore = this.getRestoreMeta(post, settings);
    const expiryAnchor = resolveExpiryAnchor(post);
    const exemptFromExpiry = isShopManagedPost(post);

    return {
      exemptFromExpiry,
      expiresAt:
        settings.postLifecycle.allowAutoExpire && expiryAnchor && !exemptFromExpiry
          ? addDays(
              expiryAnchor,
              Math.max(1, Number(settings.postLifecycle.postExpiryDays || 0)),
            ).toISOString()
          : null,
      canRestore: restore.canRestore,
      restoreUntil: restore.restoreUntil,
    };
  },

  buildRestorePayload(post: Pick<Post, "postRejectedReason">) {
    const meta = decodeTrashMeta(post.postRejectedReason);
    if (!meta) {
      return null;
    }

    return {
      postStatus: meta.previousStatus,
      postPublished: meta.previousPublished,
      postPublishedAt: meta.previousPublishedAt ? new Date(meta.previousPublishedAt) : null,
      postRejectedReason: meta.previousReason,
      postDeletedAt: null,
      postUpdatedAt: new Date(),
    };
  },
};
