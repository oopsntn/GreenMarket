import { db } from "../config/db.ts";
import { placementSlots, promotionPackages, promotionPackagePrices } from "../models/schema/index.ts";
import { SHOP_REGISTRATION_SLOT_CODE, PERSONAL_PLAN_SLOT_CODE } from "../constants/promotion.ts";
import { eq } from "drizzle-orm";
import { readSettingNumber } from "../controllers/user/pricing-config.controller.ts";

async function seed() {
  console.log("--- Seeding Standard Packages ---");

  // 1. Get current prices from settings (or defaults)
  const regPrice = await readSettingNumber("shop_registration_price", 250000);
  const personalPrice = await readSettingNumber("personal_monthly_price", 30000);

  const configs = [
    {
      slotCode: SHOP_REGISTRATION_SLOT_CODE,
      slotTitle: "Đăng ký nhà vườn",
      packageTitle: "Gói Lên Nhà Vườn (Vĩnh viễn)",
      duration: 36500, // ~100 years
      price: regPrice,
    },
    {
      slotCode: PERSONAL_PLAN_SLOT_CODE,
      slotTitle: "Nâng cấp cá nhân tháng",
      packageTitle: "Gói Cá Nhân (30 ngày)",
      duration: 30,
      price: personalPrice,
    }
  ];

  for (const config of configs) {
    // A. Ensure Slot exists
    let [slot] = await db.select().from(placementSlots).where(eq(placementSlots.placementSlotCode, config.slotCode)).limit(1);
    
    if (!slot) {
      console.log(`Creating slot: ${config.slotCode}`);
      [slot] = await db.insert(placementSlots).values({
        placementSlotCode: config.slotCode,
        placementSlotTitle: config.slotTitle,
        placementSlotCapacity: 0,
        placementSlotPublished: true,
      }).returning();
    }

    // B. Ensure Package exists
    let [pkg] = await db.select().from(promotionPackages).where(eq(promotionPackages.promotionPackageSlotId, slot.placementSlotId)).limit(1);

    if (!pkg) {
      console.log(`Creating package for slot: ${config.slotCode}`);
      [pkg] = await db.insert(promotionPackages).values({
        promotionPackageSlotId: slot.placementSlotId,
        promotionPackageTitle: config.packageTitle,
        promotionPackageDurationDays: config.duration,
        promotionPackagePublished: true,
      }).returning();
    }

    // C. Ensure Price exists (current)
    const [price] = await db.select().from(promotionPackagePrices).where(eq(promotionPackagePrices.packageId, pkg.promotionPackageId)).limit(1);
    
    if (!price) {
      console.log(`Creating price for package: ${config.packageTitle} (${config.price} VND)`);
      await db.insert(promotionPackagePrices).values({
        packageId: pkg.promotionPackageId,
        price: String(config.price),
        effectiveFrom: new Date(),
      });
    }
  }

  console.log("--- Seeding Completed ---");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
