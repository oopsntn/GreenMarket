import "dotenv/config";
import { and, desc, eq, gt, isNull, lte, ne, or } from "drizzle-orm";
import { db } from "../config/db";
import {
  placementSlots,
  promotionPackagePrices,
  promotionPackages,
  systemSettings,
} from "../models/schema";

const BOOST_SLOT_CODE = "BOOST_POST";
const SHOP_VIP_SLOT_CODE = "SHOP_VIP";

const BOOST_PACKAGES = [
  {
    title: "Goi day bai theo tuan",
    durationDays: 7,
    price: "99000.00",
    maxPosts: 1,
    displayQuota: 35000,
    description: "Uu tien hien thi bai dang trong 7 ngay cho nha vuon active.",
  },
  {
    title: "Goi day bai theo thang",
    durationDays: 30,
    price: "299000.00",
    maxPosts: 1,
    displayQuota: 180000,
    description: "Uu tien hien thi bai dang trong 30 ngay cho nha vuon active.",
  },
];

const SHOP_VIP_PACKAGE = {
  title: "Nha vuon VIP (3 thang)",
  durationDays: 90,
  price: "499000.00",
  maxPosts: 1,
  displayQuota: 0,
  description: "Uu tien shop len dau danh sach nha vuon va hien thi vien VIP trong 90 ngay.",
};

const GLOBAL_SETTINGS = [
  { key: "shop_registration_price", value: "250000" },
  { key: "personal_monthly_price", value: "30000" },
  {
    key: "owner_posting_policy",
    value: JSON.stringify({
      planTitle: "Gói Chủ Vườn Vĩnh Viễn",
      autoApprove: true,
      dailyPostLimit: 20,
      postFeeAmount: 20000,
      freeEditQuota: 4,
      editFeeAmount: 5000,
    }),
  },
  {
    key: "personal_posting_policy",
    value: JSON.stringify({
      planTitle: "Gói Cá Nhân Theo Tháng",
      autoApprove: true,
      dailyPostLimit: 20,
      postFeeAmount: 0,
      freeEditQuota: 4,
      editFeeAmount: 5000,
    }),
  },
];

const getCurrentPrice = async (packageId: number) => {
  const now = new Date();
  const [row] = await db
    .select({
      priceId: promotionPackagePrices.priceId,
      price: promotionPackagePrices.price,
    })
    .from(promotionPackagePrices)
    .where(
      and(
        eq(promotionPackagePrices.packageId, packageId),
        lte(promotionPackagePrices.effectiveFrom, now),
        or(
          isNull(promotionPackagePrices.effectiveTo),
          gt(promotionPackagePrices.effectiveTo, now),
        ),
      ),
    )
    .orderBy(
      desc(promotionPackagePrices.effectiveFrom),
      desc(promotionPackagePrices.priceId),
    )
    .limit(1);

  return row ?? null;
};

const syncCurrentPrice = async (packageId: number, nextPrice: string) => {
  const now = new Date();
  const currentPrice = await getCurrentPrice(packageId);
  if (currentPrice?.price === nextPrice) {
    return;
  }

  await db
    .update(promotionPackagePrices)
    .set({ effectiveTo: now })
    .where(
      and(
        eq(promotionPackagePrices.packageId, packageId),
        isNull(promotionPackagePrices.effectiveTo),
      ),
    );

  await db.insert(promotionPackagePrices).values({
    packageId,
    price: nextPrice,
    effectiveFrom: now,
    effectiveTo: null,
    note: "Catalog sync update",
    createdBy: null,
    createdAt: now,
  });
};

const upsertSlot = async (params: {
  code: string;
  title: string;
  capacity: number;
  rules: Record<string, unknown>;
}) => {
  const [existingSlot] = await db
    .select()
    .from(placementSlots)
    .where(eq(placementSlots.placementSlotCode, params.code))
    .limit(1);

  if (existingSlot) {
    const [updated] = await db
      .update(placementSlots)
      .set({
        placementSlotTitle: params.title,
        placementSlotCapacity: params.capacity,
        placementSlotRules: params.rules,
        placementSlotPublished: true,
      })
      .where(eq(placementSlots.placementSlotId, existingSlot.placementSlotId))
      .returning();

    return updated.placementSlotId;
  }

  const [created] = await db
    .insert(placementSlots)
    .values({
      placementSlotCode: params.code,
      placementSlotTitle: params.title,
      placementSlotCapacity: params.capacity,
      placementSlotRules: params.rules,
      placementSlotPublished: true,
    })
    .returning();

  return created.placementSlotId;
};

const upsertPackage = async (params: {
  slotId: number;
  title: string;
  durationDays: number;
  maxPosts: number;
  displayQuota: number;
  description: string;
  price: string;
}) => {
  const [existingPackage] = await db
    .select()
    .from(promotionPackages)
    .where(
      and(
        eq(promotionPackages.promotionPackageSlotId, params.slotId),
        eq(promotionPackages.promotionPackageTitle, params.title),
      ),
    )
    .limit(1);

  if (existingPackage) {
    await db
      .update(promotionPackages)
      .set({
        promotionPackageDurationDays: params.durationDays,
        promotionPackageMaxPosts: params.maxPosts,
        promotionPackageDisplayQuota: params.displayQuota,
        promotionPackageDescription: params.description,
        promotionPackagePublished: true,
      })
      .where(
        eq(
          promotionPackages.promotionPackageId,
          existingPackage.promotionPackageId,
        ),
      );

    await syncCurrentPrice(existingPackage.promotionPackageId, params.price);
    return existingPackage.promotionPackageId;
  }

  const [createdPackage] = await db
    .insert(promotionPackages)
    .values({
      promotionPackageSlotId: params.slotId,
      promotionPackageTitle: params.title,
      promotionPackageDurationDays: params.durationDays,
      promotionPackageMaxPosts: params.maxPosts,
      promotionPackageDisplayQuota: params.displayQuota,
      promotionPackageDescription: params.description,
      promotionPackagePublished: true,
    })
    .returning();

  await syncCurrentPrice(createdPackage.promotionPackageId, params.price);
  return createdPackage.promotionPackageId;
};

const upsertSystemSetting = async (key: string, value: string) => {
  await db
    .insert(systemSettings)
    .values({
      systemSettingKey: key,
      systemSettingValue: value,
      systemSettingUpdatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: systemSettings.systemSettingKey,
      set: {
        systemSettingValue: value,
        systemSettingUpdatedAt: new Date(),
      },
    });
};

const run = async () => {
  console.log("--- Syncing promotion catalog to boost-week/boost-month + shop-vip ---");

  const boostSlotId = await upsertSlot({
    code: BOOST_SLOT_CODE,
    title: "Day bai nha vuon",
    capacity: 200,
    rules: { max_per_shop: 20, min_post_status: "approved", audience: "active-shop" },
  });

  const shopVipSlotId = await upsertSlot({
    code: SHOP_VIP_SLOT_CODE,
    title: "Nha vuon VIP",
    capacity: 500,
    rules: { max_per_shop: 1, display_priority: "top", audience: "active-shop" },
  });

  await db
    .update(promotionPackages)
    .set({ promotionPackagePublished: false })
    .where(
      or(
        eq(promotionPackages.promotionPackageSlotId, boostSlotId),
        eq(promotionPackages.promotionPackageSlotId, shopVipSlotId),
      ),
    );

  for (const pkg of BOOST_PACKAGES) {
    await upsertPackage({
      slotId: boostSlotId,
      title: pkg.title,
      durationDays: pkg.durationDays,
      maxPosts: pkg.maxPosts,
      displayQuota: pkg.displayQuota,
      description: pkg.description,
      price: pkg.price,
    });
    console.log(`Upserted boost package: ${pkg.title}`);
  }

  await upsertPackage({
    slotId: shopVipSlotId,
    title: SHOP_VIP_PACKAGE.title,
    durationDays: SHOP_VIP_PACKAGE.durationDays,
    maxPosts: SHOP_VIP_PACKAGE.maxPosts,
    displayQuota: SHOP_VIP_PACKAGE.displayQuota,
    description: SHOP_VIP_PACKAGE.description,
    price: SHOP_VIP_PACKAGE.price,
  });
  console.log(`Upserted VIP package: ${SHOP_VIP_PACKAGE.title}`);

  await db
    .update(promotionPackages)
    .set({ promotionPackagePublished: false })
    .where(
      and(
        ne(promotionPackages.promotionPackageSlotId, boostSlotId),
        ne(promotionPackages.promotionPackageSlotId, shopVipSlotId),
      ),
    );

  await db
    .update(placementSlots)
    .set({ placementSlotPublished: false })
    .where(
      and(
        ne(placementSlots.placementSlotId, boostSlotId),
        ne(placementSlots.placementSlotId, shopVipSlotId),
      ),
    );

  console.log("Catalog synced. Published slots: BOOST_POST + SHOP_VIP.");

  console.log("--- Syncing global system settings ---");
  for (const setting of GLOBAL_SETTINGS) {
    await upsertSystemSetting(setting.key, setting.value);
    console.log(`Upserted system setting: ${setting.key}`);
  }
  console.log("Global settings synced.");
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed promotion catalog failed:", error);
    process.exit(1);
  });

