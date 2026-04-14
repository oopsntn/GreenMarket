import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq } from "drizzle-orm";
import { systemSettings } from "../../models/schema/index.ts";

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
  },

  personal_policy: {
    planTitle: "Gói Cá Nhân Theo Tháng",
    autoApprove: true,
    dailyPostLimit: 20,
    postFeeAmount: 0,
    freeEditQuota: 4,
    editFeeAmount: 5000,
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
    const [shopRegPrice, personalPrice, ownerPolicy, personalPolicy] =
      await Promise.all([
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
      ]);

    res.json({
      shopRegistrationPrice: shopRegPrice,
      personalMonthlyPrice: personalPrice,
      ownerPolicy,
      personalPolicy,
    });
  } catch (error) {
    console.error("Failed to load pricing config:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Re-export helpers for use in payment.service.ts
export { readSettingNumber, readSettingJson, DEFAULTS };
