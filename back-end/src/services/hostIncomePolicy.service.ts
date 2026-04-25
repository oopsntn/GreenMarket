import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../config/db.ts";
import { hostContents, ledgers } from "../models/schema/index.ts";
import { adminWebSettingsService } from "./adminWebSettings.service.ts";

type HostContentRow = {
  hostContentId: number;
  hostContentAuthorId: number | null;
  hostContentStatus: string | null;
  hostContentPayoutAmount: string | number | null;
  hostContentViewCount: number | null;
};

const toNumber = (value: string | number | null | undefined) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const isPublished = (status: string | null | undefined) =>
  (status || "").trim().toLowerCase() === "published";

const createLedgerKey = (type: string, sourceId: number) => `${type}:${sourceId}`;

const syncHostIncomeRows = async (rows: HostContentRow[]) => {
  const eligibleRows = rows.filter(
    (row) => row.hostContentId && row.hostContentAuthorId && isPublished(row.hostContentStatus),
  );

  if (eligibleRows.length === 0) {
    return;
  }

  const policy = (await adminWebSettingsService.getSettings()).hostIncome;
  const contentIds = eligibleRows.map((row) => row.hostContentId);

  const existingLedgers = await db
    .select({
      referenceId: ledgers.ledgerReferenceId,
      meta: ledgers.ledgerMeta,
    })
    .from(ledgers)
    .where(
      and(
        eq(ledgers.ledgerType, "earning"),
        eq(ledgers.ledgerDirection, "CREDIT"),
        eq(ledgers.ledgerReferenceType, "host_content"),
        inArray(ledgers.ledgerReferenceId, contentIds),
      ),
    );

  const existingKeys = new Set(
    existingLedgers
      .map((item) => {
        const referenceId = Number(item.referenceId ?? 0);
        const meta = (item.meta ?? {}) as Record<string, unknown>;
        const type = typeof meta.type === "string" ? meta.type.trim() : "";

        if (!referenceId || !type) {
          return null;
        }

        return createLedgerKey(type, referenceId);
      })
      .filter((item): item is string => Boolean(item)),
  );

  const now = new Date();
  const inserts = eligibleRows.flatMap((row) => {
    const contentId = row.hostContentId;
    const authorId = Number(row.hostContentAuthorId);
    const articlePayout =
      toNumber(row.hostContentPayoutAmount) > 0
        ? toNumber(row.hostContentPayoutAmount)
        : policy.articlePayoutAmount;

    const entries: Array<typeof ledgers.$inferInsert> = [];

    if (
      articlePayout > 0 &&
      !existingKeys.has(createLedgerKey("article_payout", contentId))
    ) {
      entries.push({
        ledgerUserId: authorId,
        ledgerAmount: articlePayout.toFixed(2),
        ledgerType: "earning",
        ledgerDirection: "CREDIT",
        ledgerStatus: "available",
        ledgerReferenceType: "host_content",
        ledgerReferenceId: contentId,
        ledgerNote: `Nhuận bút cố định cho bài Host #${contentId}`,
        ledgerMeta: {
          type: "article_payout",
          sourceId: contentId,
        },
        ledgerCreatedAt: now,
      });
    }

    if (
      policy.viewBonusAmount > 0 &&
      toNumber(row.hostContentViewCount) >= policy.viewBonusThreshold &&
      !existingKeys.has(createLedgerKey("performance_bonus", contentId))
    ) {
      entries.push({
        ledgerUserId: authorId,
        ledgerAmount: policy.viewBonusAmount.toFixed(2),
        ledgerType: "earning",
        ledgerDirection: "CREDIT",
        ledgerStatus: "available",
        ledgerReferenceType: "host_content",
        ledgerReferenceId: contentId,
        ledgerNote: `Thưởng đạt mốc lượt xem cho bài Host #${contentId}`,
        ledgerMeta: {
          type: "performance_bonus",
          sourceId: contentId,
          threshold: policy.viewBonusThreshold,
        },
        ledgerCreatedAt: now,
      });
    }

    return entries;
  });

  if (inserts.length > 0) {
    await db.insert(ledgers).values(inserts);
  }
};

export const hostIncomePolicyService = {
  async getPolicy() {
    return (await adminWebSettingsService.getSettings()).hostIncome;
  },

  async syncForContentIds(contentIds: number[]) {
    const validIds = Array.from(
      new Set(contentIds.filter((id) => Number.isFinite(id) && id > 0)),
    );

    if (validIds.length === 0) {
      return;
    }

    const rows = await db
      .select({
        hostContentId: hostContents.hostContentId,
        hostContentAuthorId: hostContents.hostContentAuthorId,
        hostContentStatus: hostContents.hostContentStatus,
        hostContentPayoutAmount: hostContents.hostContentPayoutAmount,
        hostContentViewCount: hostContents.hostContentViewCount,
      })
      .from(hostContents)
      .where(inArray(hostContents.hostContentId, validIds));

    await syncHostIncomeRows(rows);
  },

  async syncForUser(userId: number) {
    if (!Number.isFinite(userId) || userId <= 0) {
      return;
    }

    const rows = await db
      .select({
        hostContentId: hostContents.hostContentId,
        hostContentAuthorId: hostContents.hostContentAuthorId,
        hostContentStatus: hostContents.hostContentStatus,
        hostContentPayoutAmount: hostContents.hostContentPayoutAmount,
        hostContentViewCount: hostContents.hostContentViewCount,
      })
      .from(hostContents)
      .where(
        and(
          eq(hostContents.hostContentAuthorId, userId),
          isNull(hostContents.hostContentDeletedAt),
        ),
      );

    await syncHostIncomeRows(rows);
  },
};
