import { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  eventLogs,
  users,
} from "../../models/schema/index.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service.ts";

const SETTINGS_KEY = "admin_web_settings";

type SupportedLanguage = "Tiếng Việt";

type SettingsState = {
  general: {
    platformName: string;
    supportEmail: string;
    defaultLanguage: SupportedLanguage;
    otpSandboxEnabled: boolean;
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
    defaultLanguage: "Tiếng Việt",
    otpSandboxEnabled: true,
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
    defaultLanguage: "Tiếng Việt",
    otpSandboxEnabled: normalizeBoolean(
      payload?.general?.otpSandboxEnabled,
      defaultSettings.general.otpSandboxEnabled,
    ),
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
    throw new Error("Tên nền tảng là bắt buộc.");
  }

  if (!settings.general.supportEmail.includes("@")) {
    throw new Error("Email hỗ trợ không đúng định dạng.");
  }

  if (settings.moderation.reportLimit < 1) {
    throw new Error("Số báo cáo tối đa trước khi kiểm tra thủ công phải từ 1 trở lên.");
  }

  if (settings.postLifecycle.postExpiryDays < 1) {
    throw new Error("Số ngày bài đăng tự hết hạn phải từ 1 trở lên.");
  }

  if (settings.postLifecycle.restoreWindowDays < 1) {
    throw new Error("Số ngày khôi phục từ thùng rác phải từ 1 trở lên.");
  }

  if (
    settings.postLifecycle.restoreWindowDays >
    settings.postLifecycle.postExpiryDays
  ) {
    throw new Error(
      "Số ngày khôi phục không được lớn hơn số ngày bài đăng tự hết hạn.",
    );
  }

  if (settings.postLifecycle.postRateLimitPerHour < 1) {
    throw new Error("Giới hạn số bài đăng mỗi giờ phải từ 1 trở lên.");
  }

  if (settings.media.maxImagesPerPost < 1) {
    throw new Error("Số ảnh tối đa mỗi bài phải từ 1 trở lên.");
  }

  if (settings.media.maxFileSizeMb < 1) {
    throw new Error("Dung lượng tệp tối đa phải từ 1 MB trở lên.");
  }
};

const summarizeSettingsChange = (previous: SettingsState, next: SettingsState) => {
  const changes: string[] = [];

  if (previous.general.platformName !== next.general.platformName) {
    changes.push(
      `Tên nền tảng: ${previous.general.platformName} -> ${next.general.platformName}`,
    );
  }

  if (previous.general.supportEmail !== next.general.supportEmail) {
    changes.push(
      `Email hỗ trợ: ${previous.general.supportEmail} -> ${next.general.supportEmail}`,
    );
  }

  if (previous.general.defaultLanguage !== next.general.defaultLanguage) {
    changes.push(
      `Ngôn ngữ mặc định: ${previous.general.defaultLanguage} -> ${next.general.defaultLanguage}`,
    );
  }

  if (previous.general.otpSandboxEnabled !== next.general.otpSandboxEnabled) {
    changes.push(
      `OTP sandbox: ${previous.general.otpSandboxEnabled ? "Bật" : "Tắt"} -> ${next.general.otpSandboxEnabled ? "Bật" : "Tắt"}`,
    );
  }

  if (
    previous.moderation.autoModeration !== next.moderation.autoModeration
  ) {
    changes.push(
      `Tự động kiểm duyệt: ${previous.moderation.autoModeration ? "Bật" : "Tắt"} -> ${next.moderation.autoModeration ? "Bật" : "Tắt"}`,
    );
  }

  if (
    previous.moderation.bannedKeywordFilter !==
    next.moderation.bannedKeywordFilter
  ) {
    changes.push(
      `Lọc từ khóa cấm: ${previous.moderation.bannedKeywordFilter ? "Bật" : "Tắt"} -> ${next.moderation.bannedKeywordFilter ? "Bật" : "Tắt"}`,
    );
  }

  if (previous.moderation.reportLimit !== next.moderation.reportLimit) {
    changes.push(
      `Ngưỡng báo cáo thủ công: ${previous.moderation.reportLimit} -> ${next.moderation.reportLimit}`,
    );
  }

  if (
    previous.postLifecycle.postRateLimitPerHour !==
    next.postLifecycle.postRateLimitPerHour
  ) {
    changes.push(
      `Giới hạn bài đăng mỗi giờ: ${previous.postLifecycle.postRateLimitPerHour} -> ${next.postLifecycle.postRateLimitPerHour}`,
    );
  }

  if (
    previous.postLifecycle.postExpiryDays !== next.postLifecycle.postExpiryDays
  ) {
    changes.push(
      `Ngày tự hết hạn: ${previous.postLifecycle.postExpiryDays} -> ${next.postLifecycle.postExpiryDays}`,
    );
  }

  if (
    previous.postLifecycle.restoreWindowDays !==
    next.postLifecycle.restoreWindowDays
  ) {
    changes.push(
      `Ngày khôi phục: ${previous.postLifecycle.restoreWindowDays} -> ${next.postLifecycle.restoreWindowDays}`,
    );
  }

  if (
    previous.postLifecycle.allowAutoExpire !==
    next.postLifecycle.allowAutoExpire
  ) {
    changes.push(
      `Tự động hết hạn: ${previous.postLifecycle.allowAutoExpire ? "Bật" : "Tắt"} -> ${next.postLifecycle.allowAutoExpire ? "Bật" : "Tắt"}`,
    );
  }

  if (previous.media.maxImagesPerPost !== next.media.maxImagesPerPost) {
    changes.push(
      `Số ảnh tối đa: ${previous.media.maxImagesPerPost} -> ${next.media.maxImagesPerPost}`,
    );
  }

  if (previous.media.maxFileSizeMb !== next.media.maxFileSizeMb) {
    changes.push(
      `Dung lượng tệp tối đa: ${previous.media.maxFileSizeMb} -> ${next.media.maxFileSizeMb}`,
    );
  }

  if (
    previous.media.enableImageCompression !==
    next.media.enableImageCompression
  ) {
    changes.push(
      `Nén ảnh: ${previous.media.enableImageCompression ? "Bật" : "Tắt"} -> ${next.media.enableImageCompression ? "Bật" : "Tắt"}`,
    );
  }

  const previousKeywords = previous.moderation.bannedKeywords.join(", ");
  const nextKeywords = next.moderation.bannedKeywords.join(", ");

  if (previousKeywords !== nextKeywords) {
    changes.push(`Từ khóa cấm: ${previousKeywords || "Trống"} -> ${nextKeywords || "Trống"}`);
  }

  return changes.length > 0
    ? changes.join(" | ")
    : "Không có thay đổi giá trị nhưng cấu hình đã được lưu lại.";
};

const logSettingsEvent = async (
  userId: number | null | undefined,
  eventType: "admin_settings_updated" | "admin_settings_reset",
  detail: string,
) => {
  let performedBy = "Quản trị viên hệ thống";

  if (userId) {
    const [user] = await db
      .select({
        displayName: users.userDisplayName,
        email: users.userEmail,
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    performedBy = user?.displayName || user?.email || `Người dùng #${userId}`;
  }

  await db.insert(eventLogs).values({
    eventLogUserId: userId ?? null,
    eventLogEventType: eventType,
    eventLogEventTime: new Date(),
    eventLogMeta: {
      action:
        eventType === "admin_settings_reset"
          ? "Khôi phục thiết lập hệ thống"
          : "Cập nhật thiết lập hệ thống",
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
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
      error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
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
      "Thiết lập hệ thống đã được khôi phục về giá trị mặc định.",
    );

    res.json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
    });
  }
};
