import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../config/db.ts";
import { earnings, hostContents } from "../models/schema/index.ts";
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
  (status || "").toLowerCase() === "published";

const createEarningKey = (type: string, sourceId: number) => `${type}:${sourceId}`;

const syncHostIncomeRows = async (rows: HostContentRow[]) => {
  const eligibleRows = rows.filter(
    (row) => row.hostContentId && row.hostContentAuthorId && isPublished(row.hostContentStatus),
  );

  if (eligibleRows.length === 0) {
    return;
  }

  const policy = (await adminWebSettingsService.getSettings()).hostIncome;
  const contentIds = eligibleRows.map((row) => row.hostContentId);

  const existingEarnings = await db
    .select({
      type: earnings.type,
      sourceId: earnings.sourceId,
    })
    .from(earnings)
    .where(inArray(earnings.sourceId, contentIds));

  const existingKeys = new Set(
    existingEarnings
      .filter((item) => item.sourceId !== null)
      .map((item) => createEarningKey(item.type, Number(item.sourceId))),
  );

  const inserts = eligibleRows.flatMap((row) => {
    const contentId = row.hostContentId;
    const authorId = Number(row.hostContentAuthorId);
    const articlePayout =
      toNumber(row.hostContentPayoutAmount) > 0
        ? toNumber(row.hostContentPayoutAmount)
        : policy.articlePayoutAmount;
    const entries: Array<{
      userId: number;
      amount: string;
      status: "available";
      type: "article_payout" | "performance_bonus";
      sourceId: number;
      createdAt: Date;
    }> = [];

    if (
      articlePayout > 0 &&
      !existingKeys.has(createEarningKey("article_payout", contentId))
    ) {
      entries.push({
        userId: authorId,
        amount: articlePayout.toFixed(2),
        status: "available",
        type: "article_payout",
        sourceId: contentId,
        createdAt: new Date(),
      });
    }

    if (
      policy.viewBonusAmount > 0 &&
      toNumber(row.hostContentViewCount) >= policy.viewBonusThreshold &&
      !existingKeys.has(createEarningKey("performance_bonus", contentId))
    ) {
      entries.push({
        userId: authorId,
        amount: policy.viewBonusAmount.toFixed(2),
        status: "available",
        type: "performance_bonus",
        sourceId: contentId,
        createdAt: new Date(),
      });
    }

    return entries;
  });

  if (inserts.length > 0) {
    await db.insert(earnings).values(inserts);
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
