import { Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  aiInsights,
  placementSlots,
  trendScores,
  users,
} from "../../models/schema/index.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service.ts";
import { adminReportingService } from "../../services/adminReporting.service.ts";

const AI_INSIGHT_SETTINGS_KEY = "admin_ai_insight_settings";

type AIInsightFocus =
  | "Placement Performance"
  | "Promotion Watchlist"
  | "Revenue Signals"
  | "Operator Load";

type AIInsightSettings = {
  autoDailySummary: boolean;
  anomalyAlerts: boolean;
  operatorDigest: boolean;
  recommendationTone: "Conservative" | "Balanced" | "Aggressive";
  confidenceThreshold: number;
  promptVersion: string;
  reviewMode: "Required" | "Optional";
};

type InsightMeta = {
  title?: string;
  focus?: AIInsightFocus;
  status?: "Generated" | "Needs Review" | "Archived";
  generatedBy?: string;
};

const defaultSettings: AIInsightSettings = {
  autoDailySummary: true,
  anomalyAlerts: true,
  operatorDigest: false,
  recommendationTone: "Balanced",
  confidenceThreshold: 78,
  promptVersion: "gm-admin-v1.4",
  reviewMode: "Required",
};

const normalizeSettings = (
  payload: Partial<AIInsightSettings>,
): AIInsightSettings => ({
  ...defaultSettings,
  ...payload,
});

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveMomentum = (score: number) => {
  if (score >= 85) return "Up";
  if (score >= 65) return "Stable";
  return "Down";
};

const getGeneratedBy = (req: AuthRequest) =>
  req.user?.email || req.user?.mobile || "System Administrator";

const getFallbackRequestedBy = async () => {
  const [user] = await db
    .select({ userId: users.userId })
    .from(users)
    .orderBy(users.userId)
    .limit(1);

  return user?.userId ?? null;
};

export const getAIInsightSettings = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const settings = await adminConfigStoreService.getJson<AIInsightSettings>(
      AI_INSIGHT_SETTINGS_KEY,
      defaultSettings,
    );

    res.json(normalizeSettings(settings));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAIInsightSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const settings = normalizeSettings(req.body as Partial<AIInsightSettings>);
    const savedSettings = await adminConfigStoreService.setJson(
      AI_INSIGHT_SETTINGS_KEY,
      settings,
      req.user?.id,
    );

    res.json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAITrendRows = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fromDate, toDate } = req.query as {
      fromDate?: string;
      toDate?: string;
    };

    const storedScores = await db
      .select({
        id: trendScores.trendScoreId,
        score: trendScores.trendScoreScore,
        updatedAt: trendScores.trendScoreCreatedAt,
        slotTitle: placementSlots.placementSlotTitle,
        slotCode: placementSlots.placementSlotCode,
      })
      .from(trendScores)
      .leftJoin(
        placementSlots,
        eq(trendScores.trendScoreSlotId, placementSlots.placementSlotId),
      )
      .orderBy(desc(trendScores.trendScoreCreatedAt));

    if (storedScores.length > 0) {
      res.json(
        storedScores.map((item) => {
          const score = Math.round(parseNumber(item.score));

          return {
            id: item.id,
            focus: "Placement Performance",
            entity: item.slotTitle || item.slotCode || "Placement Slot",
            score,
            momentum: resolveMomentum(score),
            recommendation:
              score >= 85
                ? "Keep this placement prominent in the promotion mix."
                : "Review delivery and revenue contribution before scaling.",
            owner: "Analytics Service",
            updatedAt: formatDateTime(item.updatedAt),
          };
        }),
      );
      return;
    }

    const analytics = await adminReportingService.getAnalyticsSummary(
      fromDate,
      toDate,
    );
    const revenue = await adminReportingService.getRevenueSummary(
      fromDate,
      toDate,
    );
    const revenueRows = new Map(
      revenue.rows.map((row) => [row.slot, row.revenue]),
    );

    res.json(
      analytics.topPlacements.map((item, index) => {
        const ctr = parseNumber(item.ctr.replace("%", ""));
        const score = Math.min(99, Math.max(50, Math.round(65 + ctr * 6)));

        return {
          id: index + 1,
          focus: index % 2 === 0 ? "Placement Performance" : "Revenue Signals",
          entity: item.slot,
          score,
          momentum: resolveMomentum(score),
          recommendation: revenueRows.has(item.slot)
            ? "Monitor paid performance and keep capacity aligned with demand."
            : "This slot has traffic but no paid revenue in the selected range.",
          owner: "Admin Reporting API",
          updatedAt: toDate || new Date().toISOString().slice(0, 10),
        };
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAIInsightHistory = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(aiInsights)
      .orderBy(desc(aiInsights.aiInsightCreatedAt));

    res.json(
      rows.map((row) => {
        const meta = row.aiInsightInputSnapshot as InsightMeta | null;
        const focus =
          meta?.focus ||
          (row.aiInsightScope as AIInsightFocus) ||
          "Placement Performance";

        return {
          id: row.aiInsightId,
          title: meta?.title || `${focus} summary`,
          focus,
          summary: row.aiInsightOutputText || "No generated summary text.",
          generatedBy: meta?.generatedBy || row.aiInsightProvider || "System",
          generatedAt: formatDateTime(row.aiInsightCreatedAt),
          status: meta?.status || "Generated",
        };
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const generateAIInsight = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      focus = "Placement Performance",
      tone = "Balanced",
      generatedAt = new Date().toISOString().slice(0, 10),
    } = req.body as {
      focus?: AIInsightFocus;
      tone?: string;
      generatedAt?: string;
    };
    const requestedBy = await getFallbackRequestedBy();

    if (!requestedBy) {
      res.status(400).json({ error: "At least one user is required to store an insight." });
      return;
    }

    const [createdInsight] = await db
      .insert(aiInsights)
      .values({
        aiInsightRequestedBy: requestedBy,
        aiInsightScope: focus,
        aiInsightInputSnapshot: {
          title: `${focus} summary`,
          focus,
          status: "Needs Review",
          generatedBy: getGeneratedBy(req),
          generatedAt,
        },
        aiInsightOutputText: `Generated a ${tone.toLowerCase()} recommendation summary for ${focus.toLowerCase()} using the latest admin filters.`,
        aiInsightProvider: "Admin Manual Trigger",
        aiInsightCreatedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      id: createdInsight.aiInsightId,
      title: `${focus} summary`,
      focus,
      summary: createdInsight.aiInsightOutputText,
      generatedBy: getGeneratedBy(req),
      generatedAt: formatDateTime(createdInsight.aiInsightCreatedAt),
      status: "Needs Review",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
