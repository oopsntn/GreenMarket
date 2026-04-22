import { and, count, eq, gte } from "drizzle-orm";
import { db } from "../config/db";
import { adminConfigStoreService } from "./adminConfigStore.service";
import { posts } from "../models/schema/posts";

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
};

const normalizeNumber = (value: unknown, fallback: number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
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

const normalizeSettings = (
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
    reportLimit: normalizeNumber(
      payload?.moderation?.reportLimit,
      defaultAdminWebSettings.moderation.reportLimit,
    ),
  },
  postLifecycle: {
    postExpiryDays: normalizeNumber(
      payload?.postLifecycle?.postExpiryDays,
      defaultAdminWebSettings.postLifecycle.postExpiryDays,
    ),
    restoreWindowDays: normalizeNumber(
      payload?.postLifecycle?.restoreWindowDays,
      defaultAdminWebSettings.postLifecycle.restoreWindowDays,
    ),
    allowAutoExpire: normalizeBoolean(
      payload?.postLifecycle?.allowAutoExpire,
      defaultAdminWebSettings.postLifecycle.allowAutoExpire,
    ),
    postRateLimitPerHour: normalizeNumber(
      payload?.postLifecycle?.postRateLimitPerHour,
      defaultAdminWebSettings.postLifecycle.postRateLimitPerHour,
    ),
  },
  media: {
    maxImagesPerPost: normalizeNumber(
      payload?.media?.maxImagesPerPost,
      defaultAdminWebSettings.media.maxImagesPerPost,
    ),
    maxFileSizeMb: normalizeNumber(
      payload?.media?.maxFileSizeMb,
      defaultAdminWebSettings.media.maxFileSizeMb,
    ),
    enableImageCompression: normalizeBoolean(
      payload?.media?.enableImageCompression,
      defaultAdminWebSettings.media.enableImageCompression,
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

    return normalizeSettings(raw);
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

  findMatchedKeywords(inputValues: Array<string | null | undefined>, settings: AdminWebSettingsState) {
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
    const hourlyLimit = Math.max(1, Number(settings.postLifecycle.postRateLimitPerHour || 0));
    const since = new Date(Date.now() - 60 * 60 * 1000);

    const [row] = await db
      .select({ total: count() })
      .from(posts)
      .where(
        and(
          eq(posts.postAuthorId, userId),
          gte(posts.postCreatedAt, since),
        ),
      );

    const total = Number(row?.total || 0);
    if (total >= hourlyLimit) {
      const error = new Error(`Bạn đã đạt giới hạn ${hourlyLimit} bài đăng trong 1 giờ.`);
      (error as Error & { statusCode?: number; code?: string }).statusCode = 429;
      (error as Error & { statusCode?: number; code?: string }).code = "POST_RATE_LIMIT_PER_HOUR_REACHED";
      throw error;
    }
  },
};
