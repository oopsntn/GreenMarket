import "dotenv/config";
import { and, desc, eq, gt, isNull, lte, ne, or } from "drizzle-orm";
import { db } from "../config/db";
import {
  BOOST_POST_SLOT_CODE,
  SHOP_VIP_SLOT_CODE,
} from "../constants/promotion";
import {
  placementSlots,
  promotionPackagePrices,
  promotionPackages,
  systemSettings,
} from "../models/schema";

const CATALOG_SLOTS = [
  {
    code: BOOST_POST_SLOT_CODE,
    title: "Vi tri 1",
    capacity: 1,
    rules: {
      scope: "Homepage",
      displayRule: "Priority Score",
      priority: 1,
      notes: "Vi tri dau tien danh cho bai day tren trang chu.",
    },
  },
  {
    code: SHOP_VIP_SLOT_CODE,
    title: "Goi tai khoan",
    capacity: 500,
    rules: {
      audience: "active-shop",
      target: "shop-list",
      priority: 1,
      notes: "Dung cho goi tai khoan / shop va uu tien hien thi o danh sach nha vuon.",
    },
  },
  {
    code: "BOOST_POST_2",
    title: "Vi tri 2",
    capacity: 1,
    rules: {
      scope: "Homepage",
      displayRule: "Priority Score",
      priority: 2,
      notes: "Vi tri thu hai danh cho bai day tren trang chu.",
    },
  },
  {
    code: "BOOST_POST_3",
    title: "Vi tri 3",
    capacity: 1,
    rules: {
      scope: "Homepage",
      displayRule: "Priority Score",
      priority: 3,
      notes: "Vi tri thu ba danh cho bai day tren trang chu.",
    },
  },
] as const;

const CATALOG_PACKAGES = [
  {
    slotCode: "BOOST_POST_2",
    title: "Goi day bai theo thang vi tri 2 trang chu",
    durationDays: 30,
    price: "99000.00",
    maxPosts: 1,
    displayQuota: 35000,
    description: "Uu tien hien thi bai dang trong 30 ngay o vi tri 2 trang chu.",
  },
  {
    slotCode: BOOST_POST_SLOT_CODE,
    title: "Goi day bai theo thang vi tri 1 trang chu",
    durationDays: 30,
    price: "299000.00",
    maxPosts: 1,
    displayQuota: 180000,
    description: "Uu tien hien thi bai dang trong 30 ngay o vi tri 1 trang chu.",
  },
  {
    slotCode: SHOP_VIP_SLOT_CODE,
    title: "Goi nha vuon VIP (3 thang)",
    durationDays: 90,
    price: "499000.00",
    maxPosts: 1,
    displayQuota: 0,
    description:
      "Uu tien shop len dau danh sach nha vuon va tang nhan dien VIP trong 90 ngay.",
  },
  {
    slotCode: "BOOST_POST_3",
    title: "Goi day bai theo thang vi tri 3 trang chu",
    durationDays: 30,
    price: "29000.00",
    maxPosts: 1,
    displayQuota: 5000,
    description: "Uu tien hien thi bai dang trong 30 ngay o vi tri 3 trang chu.",
  },
] as const;

const GLOBAL_SETTINGS = [
  { key: "shop_registration_price", value: "250000" },
  { key: "personal_monthly_price", value: "30000" },
  {
    key: "owner_posting_policy",
    value: JSON.stringify({
      planTitle: "Goi Chu Vuon Vinh Vien",
      autoApprove: true,
      dailyPostLimit: 20,
      postFeeAmount: 20000,
      freeEditQuota: 4,
      editFeeAmount: 5000,
      features: [
        "Dang bai ngay, khong qua cho duyet",
        "Gioi han 20 bai viet moi ngay",
        "4 luot sua bai mien phi",
        "Phi dang tin le cuc thap",
      ],
    }),
  },
  {
    key: "personal_posting_policy",
    value: JSON.stringify({
      planTitle: "Goi Ca Nhan Theo Thang",
      autoApprove: true,
      dailyPostLimit: 20,
      postFeeAmount: 0,
      freeEditQuota: 4,
      editFeeAmount: 5000,
      features: [
        "Danh cho nguoi choi nho le",
        "Dang bai tu dong duyet trong chu ky",
        "Gioi han 20 bai viet moi ngay",
        "4 luot sua bai mien phi moi thang",
      ],
    }),
  },
  {
    key: "shop_vip_policy",
    value: JSON.stringify({
      planTitle: "Goi Nha Vuon VIP",
      features: [
        "Xep dau danh sach nha vuon",
        "Gan nhan VIP noi bat trong danh sach nha vuon",
        "Hien thi vien vang sang trong cho shop",
        "Uu tien ho tro tu doi ngu van hanh",
      ],
    }),
  },
] as const;

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
  console.log("--- Syncing promotion catalog to current homepage-slot model ---");

  const slotIdMap = new Map<string, number>();
  for (const slot of CATALOG_SLOTS) {
    const slotId = await upsertSlot(slot);
    slotIdMap.set(slot.code, slotId);
    console.log(`Upserted slot: ${slot.code}`);
  }

  await db.update(promotionPackages).set({ promotionPackagePublished: false });

  for (const pkg of CATALOG_PACKAGES) {
    const slotId = slotIdMap.get(pkg.slotCode);
    if (!slotId) {
      throw new Error(`Slot not found for package ${pkg.title}`);
    }

    await upsertPackage({
      slotId,
      title: pkg.title,
      durationDays: pkg.durationDays,
      maxPosts: pkg.maxPosts,
      displayQuota: pkg.displayQuota,
      description: pkg.description,
      price: pkg.price,
    });
    console.log(`Upserted package: ${pkg.title}`);
  }

  const publishedSlotIds = Array.from(slotIdMap.values());

  await db
    .update(promotionPackages)
    .set({ promotionPackagePublished: false })
    .where(
      and(
        isNull(promotionPackages.promotionPackageDeletedAt),
        ne(promotionPackages.promotionPackageSlotId, publishedSlotIds[0]),
        ne(promotionPackages.promotionPackageSlotId, publishedSlotIds[1]),
        ne(promotionPackages.promotionPackageSlotId, publishedSlotIds[2]),
        ne(promotionPackages.promotionPackageSlotId, publishedSlotIds[3]),
      ),
    );

  await db
    .update(placementSlots)
    .set({ placementSlotPublished: false })
    .where(
      and(
        ne(placementSlots.placementSlotId, publishedSlotIds[0]),
        ne(placementSlots.placementSlotId, publishedSlotIds[1]),
        ne(placementSlots.placementSlotId, publishedSlotIds[2]),
        ne(placementSlots.placementSlotId, publishedSlotIds[3]),
      ),
    );

  console.log("Catalog synced. Published slots: BOOST_POST, SHOP_VIP, BOOST_POST_2, BOOST_POST_3.");

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
