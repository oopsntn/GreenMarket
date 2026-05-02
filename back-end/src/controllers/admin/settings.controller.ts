import { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth";
import { eventLogs, users } from "../../models/schema/index.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service.ts";
import {
  adminWebSettingsService,
  defaultAdminWebSettings,
  type AdminWebSettingsState,
  normalizeAdminWebSettings,
} from "../../services/adminWebSettings.service.ts";

const SETTINGS_KEY = "admin_web_settings";

const validateSettings = (settings: AdminWebSettingsState) => {
  if (!settings.general.platformName.trim()) {
    throw new Error("Tên nền tảng là bắt buộc.");
  }

  if (!settings.general.supportEmail.includes("@")) {
    throw new Error("Email hỗ trợ không đúng định dạng.");
  }

  if (settings.moderation.reportLimit < 1) {
    throw new Error(
      "Số báo cáo tối đa trước khi kiểm tra thủ công phải từ 1 trở lên.",
    );
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

  if (settings.hostIncome.articlePayoutAmount < 0) {
    throw new Error("Nhuận bút cố định mỗi bài không được âm.");
  }

  if (settings.hostIncome.viewBonusThreshold < 1) {
    throw new Error("Mốc lượt xem nhận thưởng phải từ 1 trở lên.");
  }

  if (settings.hostIncome.viewBonusAmount < 0) {
    throw new Error("Tiền thưởng lượt xem không được âm.");
  }

};

const summarizeSettingsChange = (
  previous: AdminWebSettingsState,
  next: AdminWebSettingsState,
) => {
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

  if (
    previous.hostIncome.articlePayoutAmount !==
    next.hostIncome.articlePayoutAmount
  ) {
    changes.push(
      `Nhuận bút cố định mỗi bài: ${previous.hostIncome.articlePayoutAmount} -> ${next.hostIncome.articlePayoutAmount}`,
    );
  }

  if (
    previous.hostIncome.viewBonusThreshold !==
    next.hostIncome.viewBonusThreshold
  ) {
    changes.push(
      `Mốc lượt xem nhận thưởng: ${previous.hostIncome.viewBonusThreshold} -> ${next.hostIncome.viewBonusThreshold}`,
    );
  }

  if (
    previous.hostIncome.viewBonusAmount !== next.hostIncome.viewBonusAmount
  ) {
    changes.push(
      `Thưởng lượt xem cố định: ${previous.hostIncome.viewBonusAmount} -> ${next.hostIncome.viewBonusAmount}`,
    );
  }

  const previousKeywords = previous.moderation.bannedKeywords.join(", ");
  const nextKeywords = next.moderation.bannedKeywords.join(", ");

  if (previousKeywords !== nextKeywords) {
    changes.push(
      `Từ khóa cấm: ${previousKeywords || "Trống"} -> ${nextKeywords || "Trống"}`,
    );
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
    const settings = await adminWebSettingsService.getSettings();
    res.json(settings);
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
    const currentSettings = await adminWebSettingsService.getSettings();
    const nextSettings = normalizeAdminWebSettings(
      req.body as Partial<AdminWebSettingsState>,
    );

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
      defaultAdminWebSettings,
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
