import { and, count, eq, gte } from "drizzle-orm";
import { db } from "../config/db.ts";
import { adminConfigStoreService } from "./adminConfigStore.service.ts";
import { posts } from "../models/schema/posts.ts";

const SETTINGS_KEY = "admin_web_settings";

export type SupportedLanguage = "Tiếng Việt";

export type AdminWebSettingsState = {
  general: {
    platformName: string;
    supportEmail: string;
    defaultLanguage: SupportedLanguage;
  };
  moderation: {
    autoModeration: boolean;
    bannedKeywordFilter: boolean;
    bannedKeywords: string[];
    reportLimit: number;
  };
  postLifecycle: {
    postExpiryDays: number;
    restoreWindowDays: number;
    allowAutoExpire: boolean;
    postRateLimitPerHour: number;
  };
  media: {
    maxImagesPerPost: number;
    maxFileSizeMb: number;
    enableImageCompression: boolean;
  };
  hostIncome: {
    articlePayoutAmount: number;
    viewBonusThreshold: number;
    viewBonusAmount: number;
    minimumPayoutRequestAmount: number;
  };
};

export const defaultAdminWebSettings: AdminWebSettingsState = {
  general: {
    platformName: "GreenMarket",
    supportEmail: "support@greenmarket.vn",
    defaultLanguage: "Tiếng Việt",
  },
  moderation: {
    autoModeration: true,
    bannedKeywordFilter: true,
    bannedKeywords: ["lừa đảo", "spam", "vi phạm", "cấm"],
    reportLimit: 5,
  },
  postLifecycle: {
    postExpiryDays: 30,
    restoreWindowDays: 7,
    allowAutoExpire: true,
    postRateLimitPerHour: 10,
  },
  media: {
    maxImagesPerPost: 10,
    maxFileSizeMb: 5,
    enableImageCompression: true,
  },
  hostIncome: {
    articlePayoutAmount: 300_000,
    viewBonusThreshold: 1_000,
    viewBonusAmount: 120_000,
    minimumPayoutRequestAmount: 100_000,
  },
};

const normalizeNumber = (value: unknown, fallback: number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizePositiveInteger = (value: unknown, fallback: number) => {
  const numeric = Math.floor(normalizeNumber(value, fallback));
  return numeric >= 0 ? numeric : fallback;
};

const normalizeBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const normalizeString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const normalizeKeywordList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return defaultAdminWebSettings.moderation.bannedKeywords;
  }

  const normalized = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

export const normalizeAdminWebSettings = (
  payload: Partial<AdminWebSettingsState> | undefined,
): AdminWebSettingsState => ({
  general: {
    platformName: normalizeString(
      payload?.general?.platformName,
      defaultAdminWebSettings.general.platformName,
    ),
    supportEmail: normalizeString(
      payload?.general?.supportEmail,
      defaultAdminWebSettings.general.supportEmail,
    ),
    defaultLanguage: "Tiếng Việt",
  },
  moderation: {
    autoModeration: normalizeBoolean(
      payload?.moderation?.autoModeration,
      defaultAdminWebSettings.moderation.autoModeration,
    ),
    bannedKeywordFilter: normalizeBoolean(
      payload?.moderation?.bannedKeywordFilter,
      defaultAdminWebSettings.moderation.bannedKeywordFilter,
    ),
    bannedKeywords: normalizeKeywordList(payload?.moderation?.bannedKeywords),
    reportLimit: Math.max(
      1,
      normalizePositiveInteger(
        payload?.moderation?.reportLimit,
        defaultAdminWebSettings.moderation.reportLimit,
      ),
    ),
  },
  postLifecycle: {
    postExpiryDays: Math.max(
      1,
      normalizePositiveInteger(
        payload?.postLifecycle?.postExpiryDays,
        defaultAdminWebSettings.postLifecycle.postExpiryDays,
      ),
    ),
    restoreWindowDays: Math.max(
      1,
      normalizePositiveInteger(
        payload?.postLifecycle?.restoreWindowDays,
        defaultAdminWebSettings.postLifecycle.restoreWindowDays,
      ),
    ),
    allowAutoExpire: normalizeBoolean(
      payload?.postLifecycle?.allowAutoExpire,
      defaultAdminWebSettings.postLifecycle.allowAutoExpire,
    ),
    postRateLimitPerHour: Math.max(
      1,
      normalizePositiveInteger(
        payload?.postLifecycle?.postRateLimitPerHour,
        defaultAdminWebSettings.postLifecycle.postRateLimitPerHour,
      ),
    ),
  },
  media: {
    maxImagesPerPost: Math.max(
      1,
      normalizePositiveInteger(
        payload?.media?.maxImagesPerPost,
        defaultAdminWebSettings.media.maxImagesPerPost,
      ),
    ),
    maxFileSizeMb: Math.max(
      1,
      normalizePositiveInteger(
        payload?.media?.maxFileSizeMb,
        defaultAdminWebSettings.media.maxFileSizeMb,
      ),
    ),
    enableImageCompression: normalizeBoolean(
      payload?.media?.enableImageCompression,
      defaultAdminWebSettings.media.enableImageCompression,
    ),
  },
  hostIncome: {
    articlePayoutAmount: Math.max(
      0,
      normalizePositiveInteger(
        payload?.hostIncome?.articlePayoutAmount,
        defaultAdminWebSettings.hostIncome.articlePayoutAmount,
      ),
    ),
    viewBonusThreshold: Math.max(
      1,
      normalizePositiveInteger(
        payload?.hostIncome?.viewBonusThreshold,
        defaultAdminWebSettings.hostIncome.viewBonusThreshold,
      ),
    ),
    viewBonusAmount: Math.max(
      0,
      normalizePositiveInteger(
        payload?.hostIncome?.viewBonusAmount,
        defaultAdminWebSettings.hostIncome.viewBonusAmount,
      ),
    ),
    minimumPayoutRequestAmount: Math.max(
      0,
      normalizePositiveInteger(
        payload?.hostIncome?.minimumPayoutRequestAmount,
        defaultAdminWebSettings.hostIncome.minimumPayoutRequestAmount,
      ),
    ),
  },
});

const normalizeKeyword = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const adminWebSettingsService = {
  async getSettings(): Promise<AdminWebSettingsState> {
    const raw = await adminConfigStoreService.getJson<
      Partial<AdminWebSettingsState>
    >(SETTINGS_KEY, defaultAdminWebSettings);

    return normalizeAdminWebSettings(raw);
  },

  async getPublicSettings() {
    const settings = await this.getSettings();

    return {
      general: {
        platformName: settings.general.platformName,
        supportEmail: settings.general.supportEmail,
      },
      postLifecycle: {
        postRateLimitPerHour: settings.postLifecycle.postRateLimitPerHour,
        postExpiryDays: settings.postLifecycle.postExpiryDays,
        restoreWindowDays: settings.postLifecycle.restoreWindowDays,
        allowAutoExpire: settings.postLifecycle.allowAutoExpire,
      },
      media: settings.media,
    };
  },

  findMatchedKeywords(
    inputValues: Array<string | null | undefined>,
    settings: AdminWebSettingsState,
  ) {
    if (!settings.moderation.bannedKeywordFilter) {
      return [];
    }

    const haystack = normalizeKeyword(inputValues.filter(Boolean).join(" "));
    if (!haystack) {
      return [];
    }

    return settings.moderation.bannedKeywords.filter((keyword) => {
      const normalizedKeyword = normalizeKeyword(keyword);
      return normalizedKeyword.length > 0 && haystack.includes(normalizedKeyword);
    });
  },

  async assertPostRateLimit(userId: number, settings: AdminWebSettingsState) {
    const hourlyLimit = Math.max(
      1,
      Number(settings.postLifecycle.postRateLimitPerHour || 0),
    );
    const since = new Date(Date.now() - 60 * 60 * 1000);

    const [row] = await db
      .select({ total: count() })
      .from(posts)
      .where(
        and(eq(posts.postAuthorId, userId), gte(posts.postCreatedAt, since)),
      );

    const total = Number(row?.total || 0);
    if (total >= hourlyLimit) {
      const error = new Error(
        `Bạn đã đạt giới hạn ${hourlyLimit} bài đăng trong 1 giờ.`,
      );
      (error as Error & { statusCode?: number; code?: string }).statusCode = 429;
      (error as Error & { statusCode?: number; code?: string }).code =
        "POST_RATE_LIMIT_PER_HOUR_REACHED";
      throw error;
    }
  },
};
