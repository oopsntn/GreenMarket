import { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth";
import {
  eventLogs,
  users,
} from "../../models/schema/index.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service";

const SETTINGS_KEY = "admin_web_settings";

type SupportedLanguage = "Tiáº¿ng Viá»‡t";

type SettingsState = {
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

const defaultSettings: SettingsState = {
  general: {
    platformName: "GreenMarket",
    supportEmail: "support@greenmarket.vn",
    defaultLanguage: "Tiáº¿ng Viá»‡t",
  },
  moderation: {
    autoModeration: true,
    bannedKeywordFilter: true,
    bannedKeywords: ["lá»«a Ä‘áº£o", "spam", "vi pháº¡m", "cáº¥m"],
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

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  return typeof value === "boolean" ? value : fallback;
};

const normalizeString = (value: unknown, fallback: string) => {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const normalizeKeywordList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return defaultSettings.moderation.bannedKeywords;
  }

  const normalized = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

const normalizeSettings = (payload: Partial<SettingsState> | undefined): SettingsState => ({
  general: {
    platformName: normalizeString(
      payload?.general?.platformName,
      defaultSettings.general.platformName,
    ),
    supportEmail: normalizeString(
      payload?.general?.supportEmail,
      defaultSettings.general.supportEmail,
    ),
    defaultLanguage: "Tiáº¿ng Viá»‡t",
  },
  moderation: {
    autoModeration: normalizeBoolean(
      payload?.moderation?.autoModeration,
      defaultSettings.moderation.autoModeration,
    ),
    bannedKeywordFilter: normalizeBoolean(
      payload?.moderation?.bannedKeywordFilter,
      defaultSettings.moderation.bannedKeywordFilter,
    ),
    bannedKeywords: normalizeKeywordList(payload?.moderation?.bannedKeywords),
    reportLimit: normalizeNumber(
      payload?.moderation?.reportLimit,
      defaultSettings.moderation.reportLimit,
    ),
  },
  postLifecycle: {
    postExpiryDays: normalizeNumber(
      payload?.postLifecycle?.postExpiryDays,
      defaultSettings.postLifecycle.postExpiryDays,
    ),
    restoreWindowDays: normalizeNumber(
      payload?.postLifecycle?.restoreWindowDays,
      defaultSettings.postLifecycle.restoreWindowDays,
    ),
    allowAutoExpire: normalizeBoolean(
      payload?.postLifecycle?.allowAutoExpire,
      defaultSettings.postLifecycle.allowAutoExpire,
    ),
    postRateLimitPerHour: normalizeNumber(
      payload?.postLifecycle?.postRateLimitPerHour,
      defaultSettings.postLifecycle.postRateLimitPerHour,
    ),
  },
  media: {
    maxImagesPerPost: normalizeNumber(
      payload?.media?.maxImagesPerPost,
      defaultSettings.media.maxImagesPerPost,
    ),
    maxFileSizeMb: normalizeNumber(
      payload?.media?.maxFileSizeMb,
      defaultSettings.media.maxFileSizeMb,
    ),
    enableImageCompression: normalizeBoolean(
      payload?.media?.enableImageCompression,
      defaultSettings.media.enableImageCompression,
    ),
  },
});

const validateSettings = (settings: SettingsState) => {
  if (!settings.general.platformName.trim()) {
    throw new Error("TÃªn ná»n táº£ng lÃ  báº¯t buá»™c.");
  }

  if (!settings.general.supportEmail.includes("@")) {
    throw new Error("Email há»— trá»£ khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng.");
  }

  if (settings.moderation.reportLimit < 1) {
    throw new Error("Sá»‘ bÃ¡o cÃ¡o tá»‘i Ä‘a trÆ°á»›c khi kiá»ƒm tra thá»§ cÃ´ng pháº£i tá»« 1 trá»Ÿ lÃªn.");
  }

  if (settings.postLifecycle.postExpiryDays < 1) {
    throw new Error("Sá»‘ ngÃ y bÃ i Ä‘Äƒng tá»± háº¿t háº¡n pháº£i tá»« 1 trá»Ÿ lÃªn.");
  }

  if (settings.postLifecycle.restoreWindowDays < 1) {
    throw new Error("Sá»‘ ngÃ y khÃ´i phá»¥c tá»« thÃ¹ng rÃ¡c pháº£i tá»« 1 trá»Ÿ lÃªn.");
  }

  if (
    settings.postLifecycle.restoreWindowDays >
    settings.postLifecycle.postExpiryDays
  ) {
    throw new Error(
      "Sá»‘ ngÃ y khÃ´i phá»¥c khÃ´ng Ä‘Æ°á»£c lá»›n hÆ¡n sá»‘ ngÃ y bÃ i Ä‘Äƒng tá»± háº¿t háº¡n.",
    );
  }

  if (settings.postLifecycle.postRateLimitPerHour < 1) {
    throw new Error("Giá»›i háº¡n sá»‘ bÃ i Ä‘Äƒng má»—i giá» pháº£i tá»« 1 trá»Ÿ lÃªn.");
  }

  if (settings.media.maxImagesPerPost < 1) {
    throw new Error("Sá»‘ áº£nh tá»‘i Ä‘a má»—i bÃ i pháº£i tá»« 1 trá»Ÿ lÃªn.");
  }

  if (settings.media.maxFileSizeMb < 1) {
    throw new Error("Dung lÆ°á»£ng tá»‡p tá»‘i Ä‘a pháº£i tá»« 1 MB trá»Ÿ lÃªn.");
  }
};

const summarizeSettingsChange = (previous: SettingsState, next: SettingsState) => {
  const changes: string[] = [];

  if (previous.general.platformName !== next.general.platformName) {
    changes.push(
      `TÃªn ná»n táº£ng: ${previous.general.platformName} -> ${next.general.platformName}`,
    );
  }

  if (previous.general.supportEmail !== next.general.supportEmail) {
    changes.push(
      `Email há»— trá»£: ${previous.general.supportEmail} -> ${next.general.supportEmail}`,
    );
  }

  if (previous.general.defaultLanguage !== next.general.defaultLanguage) {
    changes.push(
      `NgÃ´n ngá»¯ máº·c Ä‘á»‹nh: ${previous.general.defaultLanguage} -> ${next.general.defaultLanguage}`,
    );
  }


  if (
    previous.moderation.autoModeration !== next.moderation.autoModeration
  ) {
    changes.push(
      `Tá»± Ä‘á»™ng kiá»ƒm duyá»‡t: ${previous.moderation.autoModeration ? "Báº­t" : "Táº¯t"} -> ${next.moderation.autoModeration ? "Báº­t" : "Táº¯t"}`,
    );
  }

  if (
    previous.moderation.bannedKeywordFilter !==
    next.moderation.bannedKeywordFilter
  ) {
    changes.push(
      `Lá»c tá»« khÃ³a cáº¥m: ${previous.moderation.bannedKeywordFilter ? "Báº­t" : "Táº¯t"} -> ${next.moderation.bannedKeywordFilter ? "Báº­t" : "Táº¯t"}`,
    );
  }

  if (previous.moderation.reportLimit !== next.moderation.reportLimit) {
    changes.push(
      `NgÆ°á»¡ng bÃ¡o cÃ¡o thá»§ cÃ´ng: ${previous.moderation.reportLimit} -> ${next.moderation.reportLimit}`,
    );
  }

  if (
    previous.postLifecycle.postRateLimitPerHour !==
    next.postLifecycle.postRateLimitPerHour
  ) {
    changes.push(
      `Giá»›i háº¡n bÃ i Ä‘Äƒng má»—i giá»: ${previous.postLifecycle.postRateLimitPerHour} -> ${next.postLifecycle.postRateLimitPerHour}`,
    );
  }

  if (
    previous.postLifecycle.postExpiryDays !== next.postLifecycle.postExpiryDays
  ) {
    changes.push(
      `NgÃ y tá»± háº¿t háº¡n: ${previous.postLifecycle.postExpiryDays} -> ${next.postLifecycle.postExpiryDays}`,
    );
  }

  if (
    previous.postLifecycle.restoreWindowDays !==
    next.postLifecycle.restoreWindowDays
  ) {
    changes.push(
      `NgÃ y khÃ´i phá»¥c: ${previous.postLifecycle.restoreWindowDays} -> ${next.postLifecycle.restoreWindowDays}`,
    );
  }

  if (
    previous.postLifecycle.allowAutoExpire !==
    next.postLifecycle.allowAutoExpire
  ) {
    changes.push(
      `Tá»± Ä‘á»™ng háº¿t háº¡n: ${previous.postLifecycle.allowAutoExpire ? "Báº­t" : "Táº¯t"} -> ${next.postLifecycle.allowAutoExpire ? "Báº­t" : "Táº¯t"}`,
    );
  }

  if (previous.media.maxImagesPerPost !== next.media.maxImagesPerPost) {
    changes.push(
      `Sá»‘ áº£nh tá»‘i Ä‘a: ${previous.media.maxImagesPerPost} -> ${next.media.maxImagesPerPost}`,
    );
  }

  if (previous.media.maxFileSizeMb !== next.media.maxFileSizeMb) {
    changes.push(
      `Dung lÆ°á»£ng tá»‡p tá»‘i Ä‘a: ${previous.media.maxFileSizeMb} -> ${next.media.maxFileSizeMb}`,
    );
  }

  if (
    previous.media.enableImageCompression !==
    next.media.enableImageCompression
  ) {
    changes.push(
      `NÃ©n áº£nh: ${previous.media.enableImageCompression ? "Báº­t" : "Táº¯t"} -> ${next.media.enableImageCompression ? "Báº­t" : "Táº¯t"}`,
    );
  }

  const previousKeywords = previous.moderation.bannedKeywords.join(", ");
  const nextKeywords = next.moderation.bannedKeywords.join(", ");

  if (previousKeywords !== nextKeywords) {
    changes.push(`Tá»« khÃ³a cáº¥m: ${previousKeywords || "Trá»‘ng"} -> ${nextKeywords || "Trá»‘ng"}`);
  }

  return changes.length > 0
    ? changes.join(" | ")
    : "KhÃ´ng cÃ³ thay Ä‘á»•i giÃ¡ trá»‹ nhÆ°ng cáº¥u hÃ¬nh Ä‘Ã£ Ä‘Æ°á»£c lÆ°u láº¡i.";
};

const logSettingsEvent = async (
  userId: number | null | undefined,
  eventType: "admin_settings_updated" | "admin_settings_reset",
  detail: string,
) => {
  let performedBy = "Quáº£n trá»‹ viÃªn há»‡ thá»‘ng";

  if (userId) {
    const [user] = await db
      .select({
        displayName: users.userDisplayName,
        email: users.userEmail,
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    performedBy = user?.displayName || user?.email || `NgÆ°á»i dÃ¹ng #${userId}`;
  }

  await db.insert(eventLogs).values({
    eventLogUserId: userId ?? null,
    eventLogEventType: eventType,
    eventLogEventTime: new Date(),
    eventLogMeta: {
      action:
        eventType === "admin_settings_reset"
          ? "KhÃ´i phá»¥c thiáº¿t láº­p há»‡ thá»‘ng"
          : "Cáº­p nháº­t thiáº¿t láº­p há»‡ thá»‘ng",
      detail,
      performedBy,
    },
  });
};

export const getSettings = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const settings = await adminConfigStoreService.getJson<SettingsState>(
      SETTINGS_KEY,
      defaultSettings,
    );

    res.json(normalizeSettings(settings));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lá»—i mÃ¡y chá»§ ná»™i bá»™" });
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const currentSettings = normalizeSettings(
      await adminConfigStoreService.getJson<SettingsState>(
        SETTINGS_KEY,
        defaultSettings,
      ),
    );
    const nextSettings = normalizeSettings(req.body as Partial<SettingsState>);

    validateSettings(nextSettings);

    const savedSettings = await adminConfigStoreService.setJson(
      SETTINGS_KEY,
      nextSettings,
      req.user?.id,
    );

    await logSettingsEvent(
      req.user?.id,
      "admin_settings_updated",
      summarizeSettingsChange(currentSettings, nextSettings),
    );

    res.json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lá»—i mÃ¡y chá»§ ná»™i bá»™",
    });
  }
};

export const resetSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const savedSettings = await adminConfigStoreService.setJson(
      SETTINGS_KEY,
      defaultSettings,
      req.user?.id,
    );

    await logSettingsEvent(
      req.user?.id,
      "admin_settings_reset",
      "Thiáº¿t láº­p há»‡ thá»‘ng Ä‘Ã£ Ä‘Æ°á»£c khÃ´i phá»¥c vá» giÃ¡ trá»‹ máº·c Ä‘á»‹nh.",
    );

    res.json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lá»—i mÃ¡y chá»§ ná»™i bá»™",
    });
  }
};

