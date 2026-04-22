import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { systemSettings } from "../../models/schema/index";

/**
 * Default values used as fallback when system_settings keys are missing.
 * Admin can override any of these via the admin settings panel.
 */
const DEFAULTS = {
  shop_registration_price: 250000,
  personal_monthly_price: 30000,

  owner_policy: {
    planTitle: "Gói Chủ Vườn Vĩnh Viễn",
    autoApprove: true,
    dailyPostLimit: 20,
    postFeeAmount: 20000,
    freeEditQuota: 4,
    editFeeAmount: 5000,
    features: [
      "Đăng bài ngay, không qua chờ duyệt",
      "Giới hạn 20 bài viết mỗi ngày",
      "4 lượt sửa bài miễn phí",
      "Phí đăng tin lẻ cực thấp",
    ],
  },

  personal_policy: {
    planTitle: "Gói Cá Nhân Theo Tháng",
    autoApprove: true,
    dailyPostLimit: 20,
    postFeeAmount: 0,
    freeEditQuota: 4,
    editFeeAmount: 5000,
    features: [
      "Dành cho người chơi nhỏ lẻ",
      "Đăng bài tự động duyệt trong chu kỳ",
      "Giới hạn 20 bài viết mỗi ngày",
      "4 lượt sửa bài miễn phí mỗi tháng",
    ],
  },
  shop_vip_policy: {
    planTitle: "Gói Nhà Vườn VIP",
    features: [
      "Xếp đầu danh sách nhà vườn",
      "Gắn nhãn VIP nổi bật trong danh sách nhà vườn",
      "Hiển thị viền vàng sang trọng cho shop",
      "Ưu tiên hỗ trợ từ đội ngũ vận hành",
    ],
  },
};

const readSettingNumber = async (
  key: string,
  fallback: number,
): Promise<number> => {
  const [row] = await db
    .select({ value: systemSettings.systemSettingValue })
    .from(systemSettings)
    .where(eq(systemSettings.systemSettingKey, key))
    .limit(1);

  if (!row?.value) return fallback;
  const parsed = Number(row.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readSettingJson = async <T>(key: string, fallback: T): Promise<T> => {
  const [row] = await db
    .select({ value: systemSettings.systemSettingValue })
    .from(systemSettings)
    .where(eq(systemSettings.systemSettingKey, key))
    .limit(1);

  if (!row?.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
};

/**
 * GET /api/pricing-config
 * Public endpoint — returns all configurable pricing + policy previews.
 * Frontend uses this to render dynamic package cards.
 */
export const getPricingConfig = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [
      shopRegPrice,
      personalPrice,
      ownerPolicy,
      personalPolicy,
      shopVipPolicy,
    ] = await Promise.all([
      readSettingNumber(
        "shop_registration_price",
        DEFAULTS.shop_registration_price,
      ),
      readSettingNumber(
        "personal_monthly_price",
        DEFAULTS.personal_monthly_price,
      ),
      readSettingJson("owner_posting_policy", DEFAULTS.owner_policy),
      readSettingJson("personal_posting_policy", DEFAULTS.personal_policy),
      readSettingJson("shop_vip_policy", DEFAULTS.shop_vip_policy),
    ]);

    res.json({
      shopRegistrationPrice: shopRegPrice,
      personalMonthlyPrice: personalPrice,
      ownerPolicy,
      personalPolicy,
      shopVipPolicy,
    });
  } catch (error) {
    console.error("Failed to load pricing config:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Re-export helpers for use in payment.service.ts
export { readSettingNumber, readSettingJson, DEFAULTS };
