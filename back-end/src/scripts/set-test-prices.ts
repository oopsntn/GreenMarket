/**
 * Script tạm thời để set giá test thấp cho VNPAY sandbox.
 * CHẠY: pnpm tsx src/scripts/set-test-prices.ts
 * VNPAY sandbox yêu cầu >= 1000 VND, dùng 2000 VND để test.
 */
import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../config/db.ts";
import {
  placementSlots,
  promotionPackages,
  promotionPackagePrices,
  systemSettings,
} from "../models/schema/index.ts";
import {
  SHOP_REGISTRATION_SLOT_CODE,
  PERSONAL_PLAN_SLOT_CODE,
} from "../constants/promotion.ts";

const TEST_PRICE_VND = "15000"; // Giá test — thay đổi tuỳ ý (min 1000)

async function setPriceForSlot(slotCode: string, newPrice: string) {
  const [slot] = await db
    .select()
    .from(placementSlots)
    .where(eq(placementSlots.placementSlotCode, slotCode))
    .limit(1);

  if (!slot) {
    console.warn(`Slot ${slotCode} không tồn tại. Bỏ qua.`);
    return;
  }

  const [pkg] = await db
    .select()
    .from(promotionPackages)
    .where(eq(promotionPackages.promotionPackageSlotId, slot.placementSlotId))
    .limit(1);

  if (!pkg) {
    console.warn(`Package cho slot ${slotCode} không tồn tại. Bỏ qua.`);
    return;
  }

  const now = new Date();

  // Đóng price hiện tại
  await db
    .update(promotionPackagePrices)
    .set({ effectiveTo: now })
    .where(
      and(
        eq(promotionPackagePrices.packageId, pkg.promotionPackageId),
        isNull(promotionPackagePrices.effectiveTo),
      ),
    );

  // Thêm price mới
  await db.insert(promotionPackagePrices).values({
    packageId: pkg.promotionPackageId,
    price: newPrice,
    effectiveFrom: now,
    effectiveTo: null,
    note: `TEST price set to ${newPrice} VND`,
    createdBy: null,
    createdAt: now,
  });

  console.log(`✅ ${slotCode}: giá đã set thành ${newPrice} VND`);
}

async function main() {
  console.log(`--- Setting test prices to ${TEST_PRICE_VND} VND ---`);

  // Cập nhật system_settings (dùng cho UI hiển thị)
  await db
    .update(systemSettings)
    .set({ systemSettingValue: TEST_PRICE_VND, systemSettingUpdatedAt: new Date() })
    .where(eq(systemSettings.systemSettingKey, "shop_registration_price"));
  console.log(`✅ system_settings: shop_registration_price = ${TEST_PRICE_VND}`);

  await db
    .update(systemSettings)
    .set({ systemSettingValue: TEST_PRICE_VND, systemSettingUpdatedAt: new Date() })
    .where(eq(systemSettings.systemSettingKey, "personal_monthly_price"));
  console.log(`✅ system_settings: personal_monthly_price = ${TEST_PRICE_VND}`);

  // Cập nhật giá trong promotion_package_prices
  await setPriceForSlot(SHOP_REGISTRATION_SLOT_CODE, TEST_PRICE_VND);
  await setPriceForSlot(PERSONAL_PLAN_SLOT_CODE, TEST_PRICE_VND);

  console.log("--- Done. Reload backend để áp dụng. ---");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
