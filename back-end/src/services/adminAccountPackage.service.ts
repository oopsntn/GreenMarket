import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { db } from "../config/db.ts";
import {
  PERSONAL_PLAN_SLOT_CODE,
  SHOP_REGISTRATION_SLOT_CODE,
  SHOP_VIP_SLOT_CODE,
} from "../constants/promotion.ts";
import {
  DEFAULTS,
  readSettingJson,
} from "../controllers/user/pricing-config.controller.ts";
import {
  eventLogs,
  placementSlots,
  promotionPackagePrices,
  promotionPackages,
  systemSettings,
} from "../models/schema/index.ts";

export const ACCOUNT_PACKAGE_CODES = [
  "OWNER_LIFETIME",
  "PERSONAL_MONTHLY",
  "SHOP_VIP",
] as const;

export type AccountPackageCode = (typeof ACCOUNT_PACKAGE_CODES)[number];

type PolicyConfig = {
  planTitle?: string;
  features?: string[];
};

export type AdminAccountPackage = {
  code: AccountPackageCode;
  title: string;
  groupLabel: string;
  scopeLabel: string;
  cycleLabel: string;
  price: number;
  description: string;
  features: string[];
  maxSales: number | null;
  durationDays: number | null;
  durationEditable: boolean;
  updatedAt: Date | null;
  statusLabel: string;
};

export class AdminAccountPackageError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const OWNER_SETTING_KEY = "shop_registration_price";
const PERSONAL_SETTING_KEY = "personal_monthly_price";
const OWNER_POLICY_KEY = "owner_posting_policy";
const PERSONAL_POLICY_KEY = "personal_posting_policy";
const SHOP_VIP_POLICY_KEY = "shop_vip_policy";

const DEFAULT_OWNER_FEATURES = [
  "Đăng bài ngay, không qua chờ duyệt",
  "Giới hạn 20 bài viết mỗi ngày",
  "4 lượt sửa bài miễn phí",
  "Phí đăng tin lẻ cực thấp",
];

const DEFAULT_PERSONAL_FEATURES = [
  "Dành cho người chơi nhỏ lẻ",
  "Đăng bài tự động duyệt trong chu kỳ",
  "Giới hạn 20 bài viết mỗi ngày",
  "4 lượt sửa bài miễn phí mỗi tháng",
];

const DEFAULT_VIP_FEATURES = [
  "Xếp đầu danh sách nhà vườn",
  "Gắn nhãn VIP nổi bật trong danh sách nhà vườn",
  "Hiển thị viền vàng sang trọng cho shop",
  "Ưu tiên hỗ trợ từ đội ngũ vận hành",
];

const parsePositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
};

const parsePositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
};

const normalizeFeatures = (
  value: string[] | undefined,
  fallback: string[],
) => {
  const source = Array.isArray(value) ? value : fallback;

  return source
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const readJsonSettingWithMeta = async <T>(
  key: string,
  fallback: T,
): Promise<{ value: T; updatedAt: Date | null }> => {
  const [row] = await db
    .select({
      value: systemSettings.systemSettingValue,
      updatedAt: systemSettings.systemSettingUpdatedAt,
    })
    .from(systemSettings)
    .where(eq(systemSettings.systemSettingKey, key))
    .limit(1);

  return {
    value: (() => {
      if (!row?.value) {
        return fallback;
      }

      try {
        return JSON.parse(row.value) as T;
      } catch {
        return fallback;
      }
    })(),
    updatedAt: row?.updatedAt ?? null,
  };
};

const readNumberSettingWithMeta = async (key: string, fallback: number) => {
  const [row] = await db
    .select({
      value: systemSettings.systemSettingValue,
      updatedAt: systemSettings.systemSettingUpdatedAt,
    })
    .from(systemSettings)
    .where(eq(systemSettings.systemSettingKey, key))
    .limit(1);

  const parsed = Number(row?.value ?? fallback);
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;

  return {
    value,
    updatedAt: row?.updatedAt ?? null,
  };
};

const upsertNumberSetting = async (
  key: string,
  value: number,
  updatedBy: number | null,
) => {
  const now = new Date();

  await db
    .insert(systemSettings)
    .values({
      systemSettingKey: key,
      systemSettingValue: String(Math.round(value)),
      systemSettingUpdatedBy: updatedBy,
      systemSettingUpdatedAt: now,
    })
    .onConflictDoUpdate({
      target: systemSettings.systemSettingKey,
      set: {
        systemSettingValue: String(Math.round(value)),
        systemSettingUpdatedBy: updatedBy,
        systemSettingUpdatedAt: now,
      },
    });

  return now;
};

const upsertJsonSetting = async (
  key: string,
  value: unknown,
  updatedBy: number | null,
) => {
  const now = new Date();

  await db
    .insert(systemSettings)
    .values({
      systemSettingKey: key,
      systemSettingValue: JSON.stringify(value),
      systemSettingUpdatedBy: updatedBy,
      systemSettingUpdatedAt: now,
    })
    .onConflictDoUpdate({
      target: systemSettings.systemSettingKey,
      set: {
        systemSettingValue: JSON.stringify(value),
        systemSettingUpdatedBy: updatedBy,
        systemSettingUpdatedAt: now,
      },
    });

  return now;
};

const getLatestUpdatedAt = (...values: Array<Date | null | undefined>) => {
  const filtered = values.filter(
    (value): value is Date => value instanceof Date && !Number.isNaN(value.getTime()),
  );

  if (!filtered.length) {
    return null;
  }

  return new Date(Math.max(...filtered.map((item) => item.getTime())));
};

const findPackageBySlotCode = async (slotCode: string) => {
  const now = new Date();

  const [pkg] = await db
    .select({
      packageId: promotionPackages.promotionPackageId,
      title: promotionPackages.promotionPackageTitle,
      description: promotionPackages.promotionPackageDescription,
      durationDays: promotionPackages.promotionPackageDurationDays,
      maxPosts: promotionPackages.promotionPackageMaxPosts,
      published: promotionPackages.promotionPackagePublished,
      priceId: promotionPackagePrices.priceId,
      price: promotionPackagePrices.price,
      effectiveFrom: promotionPackagePrices.effectiveFrom,
    })
    .from(promotionPackages)
    .innerJoin(
      placementSlots,
      eq(
        promotionPackages.promotionPackageSlotId,
        placementSlots.placementSlotId,
      ),
    )
    .leftJoin(
      promotionPackagePrices,
      and(
        eq(
          promotionPackagePrices.packageId,
          promotionPackages.promotionPackageId,
        ),
        lte(promotionPackagePrices.effectiveFrom, now),
        or(
          isNull(promotionPackagePrices.effectiveTo),
          gt(promotionPackagePrices.effectiveTo, now),
        ),
      ),
    )
    .where(
      and(
        eq(placementSlots.placementSlotCode, slotCode),
        isNull(promotionPackages.promotionPackageDeletedAt),
      ),
    )
    .orderBy(
      desc(promotionPackages.promotionPackagePublished),
      desc(promotionPackagePrices.effectiveFrom),
      desc(promotionPackages.promotionPackageId),
    )
    .limit(1);

  return pkg ?? null;
};

const setPackagePrice = async (params: {
  tx: any;
  packageId: number;
  price: number;
  adminId: number | null;
  note: string;
}) => {
  const now = new Date();

  await params.tx
    .update(promotionPackagePrices)
    .set({
      effectiveTo: now,
    })
    .where(
      and(
        eq(promotionPackagePrices.packageId, params.packageId),
        isNull(promotionPackagePrices.effectiveTo),
      ),
    );

  await params.tx.insert(promotionPackagePrices).values({
    packageId: params.packageId,
    price: params.price.toFixed(2),
    effectiveFrom: now,
    effectiveTo: null,
    note: params.note,
    createdBy: params.adminId,
    createdAt: now,
  });

  return now;
};

const logAccountPackageEvent = async (params: {
  code: AccountPackageCode;
  title: string;
  detail: string;
  performedBy: string | null;
}) => {
  await db.insert(eventLogs).values({
    eventLogUserId: null,
    eventLogTargetType: "account_package",
    eventLogTargetId: null, // Global packages use codes in metadata
    eventLogEventType: "admin_account_package_updated",
    eventLogEventTime: new Date(),
    eventLogMeta: {
      action: "Cập nhật gói tài khoản / shop",
      detail: params.detail,
      performedBy: params.performedBy?.trim() || "Quản trị viên hệ thống",
      actorRole: "Quản trị viên",
      moduleLabel: "Gói tài khoản / shop",
      targetType: "Gói tài khoản / shop",
      targetName: params.title,
      targetCode: params.code,
      result: "Thành công",
    },
  });
};

const buildOwnerPackage = async (): Promise<AdminAccountPackage> => {
  const [priceSetting, policySetting, packageMeta] = await Promise.all([
    readNumberSettingWithMeta(
      OWNER_SETTING_KEY,
      DEFAULTS.shop_registration_price,
    ),
    readJsonSettingWithMeta<PolicyConfig>(OWNER_POLICY_KEY, DEFAULTS.owner_policy),
    findPackageBySlotCode(SHOP_REGISTRATION_SLOT_CODE),
  ]);
  const policy = policySetting.value;

  return {
    code: "OWNER_LIFETIME",
    title:
      policy.planTitle?.trim() ||
      packageMeta?.title?.trim() ||
      "Gói Chủ Vườn Vĩnh Viễn",
    groupLabel: "Tài khoản / shop",
    scopeLabel: "Mở shop và vận hành tài khoản chủ vườn",
    cycleLabel: "Vĩnh viễn",
    price: priceSetting.value,
    description:
      "Nâng cấp tài khoản lên chủ vườn để mở shop và vận hành bán hàng lâu dài.",
    features: normalizeFeatures(policy.features, DEFAULT_OWNER_FEATURES),
    maxSales: packageMeta?.maxPosts ?? 1,
    durationDays: null,
    durationEditable: false,
    updatedAt: getLatestUpdatedAt(
      priceSetting.updatedAt,
      policySetting.updatedAt,
      packageMeta?.effectiveFrom ?? null,
    ),
    statusLabel: "Cố định",
  };
};

const buildPersonalPackage = async (): Promise<AdminAccountPackage> => {
  const [priceSetting, policySetting, packageMeta] = await Promise.all([
    readNumberSettingWithMeta(
      PERSONAL_SETTING_KEY,
      DEFAULTS.personal_monthly_price,
    ),
    readJsonSettingWithMeta<PolicyConfig>(
      PERSONAL_POLICY_KEY,
      DEFAULTS.personal_policy,
    ),
    findPackageBySlotCode(PERSONAL_PLAN_SLOT_CODE),
  ]);
  const policy = policySetting.value;

  return {
    code: "PERSONAL_MONTHLY",
    title:
      policy.planTitle?.trim() ||
      packageMeta?.title?.trim() ||
      "Gói Cá Nhân Theo Tháng",
    groupLabel: "Tài khoản",
    scopeLabel: "Quyền đăng bài cá nhân",
    cycleLabel: "Theo tháng",
    price: priceSetting.value,
    description:
      "Dùng cho tài khoản cá nhân đăng bài thường xuyên nhưng chưa mở shop.",
    features: normalizeFeatures(policy.features, DEFAULT_PERSONAL_FEATURES),
    maxSales: packageMeta?.maxPosts ?? 1,
    durationDays: 30,
    durationEditable: false,
    updatedAt: getLatestUpdatedAt(
      priceSetting.updatedAt,
      policySetting.updatedAt,
      packageMeta?.effectiveFrom ?? null,
    ),
    statusLabel: "Cố định",
  };
};

const buildVipPackage = async (): Promise<AdminAccountPackage> => {
  const [vipPackage, policy] = await Promise.all([
    findPackageBySlotCode(SHOP_VIP_SLOT_CODE),
    readSettingJson<PolicyConfig>(
      SHOP_VIP_POLICY_KEY,
      DEFAULTS.shop_vip_policy,
    ),
  ]);

  if (!vipPackage) {
    throw new AdminAccountPackageError(
      404,
      "Không tìm thấy gói Nhà vườn VIP trong hệ thống.",
    );
  }

  const price = Number(vipPackage.price ?? 0);

  return {
    code: "SHOP_VIP",
    title:
      policy.planTitle?.trim() ||
      vipPackage.title?.trim() ||
      "Gói Nhà Vườn VIP",
    groupLabel: "Shop",
    scopeLabel: "Ưu tiên hiển thị shop trong danh sách nhà vườn",
    cycleLabel: vipPackage.durationDays
      ? `${vipPackage.durationDays} ngày`
      : "Chu kỳ VIP",
    price: Number.isFinite(price) ? price : 0,
    description:
      vipPackage.description?.trim() ||
      "Ưu tiên hiển thị shop trong danh sách nhà vườn và tăng nhận diện cho shop.",
    features: normalizeFeatures(policy.features, DEFAULT_VIP_FEATURES),
    maxSales: vipPackage.maxPosts ?? 1,
    durationDays: vipPackage.durationDays ?? null,
    durationEditable: true,
    updatedAt: vipPackage.effectiveFrom ?? null,
    statusLabel: vipPackage.published ? "Đang bán" : "Tạm dừng",
  };
};

export const adminAccountPackageService = {
  isSupportedCode(code: string): code is AccountPackageCode {
    return ACCOUNT_PACKAGE_CODES.includes(code as AccountPackageCode);
  },

  async getCatalog(): Promise<AdminAccountPackage[]> {
    const [ownerPackage, personalPackage, vipPackage] = await Promise.all([
      buildOwnerPackage(),
      buildPersonalPackage(),
      buildVipPackage(),
    ]);

    return [ownerPackage, personalPackage, vipPackage];
  },

  async getPackageByCode(code: AccountPackageCode): Promise<AdminAccountPackage> {
    const catalog = await this.getCatalog();
    const found = catalog.find((item) => item.code === code);

    if (!found) {
      throw new AdminAccountPackageError(
        404,
        "Không tìm thấy gói tài khoản / shop.",
      );
    }

    return found;
  },

  async updatePackage(params: {
    code: AccountPackageCode;
    title: unknown;
    price: unknown;
    maxSales: unknown;
    durationDays?: unknown;
    adminId: number | null;
    adminEmail: string | null;
  }): Promise<AdminAccountPackage> {
    const parsedTitle = String(params.title ?? "").trim();
    if (!parsedTitle) {
      throw new AdminAccountPackageError(400, "Tên gói không được để trống.");
    }

    const parsedPrice = parsePositiveNumber(params.price);
    if (!parsedPrice) {
      throw new AdminAccountPackageError(400, "Giá gói phải lớn hơn 0.");
    }

    const parsedMaxSales = parsePositiveInteger(params.maxSales);
    if (!parsedMaxSales) {
      throw new AdminAccountPackageError(
        400,
        "Số lượt bán tối đa phải lớn hơn 0.",
      );
    }

    if (params.code === "OWNER_LIFETIME") {
      const previous = await this.getPackageByCode(params.code);
      const packageMeta = await findPackageBySlotCode(SHOP_REGISTRATION_SLOT_CODE);
      if (!packageMeta) {
        throw new AdminAccountPackageError(
          404,
          "Chưa cấu hình gói nền cho Chủ Vườn Vĩnh Viễn.",
        );
      }

      const policy = await readSettingJson<PolicyConfig>(
        OWNER_POLICY_KEY,
        DEFAULTS.owner_policy,
      );
      const nextPolicy = {
        ...policy,
        planTitle: parsedTitle,
      };

      await db.transaction(async (tx) => {
        await upsertNumberSetting(OWNER_SETTING_KEY, parsedPrice, params.adminId);
        await upsertJsonSetting(OWNER_POLICY_KEY, nextPolicy, params.adminId);

        await tx
          .update(promotionPackages)
          .set({
            promotionPackageTitle: parsedTitle,
            promotionPackageMaxPosts: parsedMaxSales,
          })
          .where(eq(promotionPackages.promotionPackageId, packageMeta.packageId));

        if (parsedPrice !== previous.price) {
          await setPackagePrice({
            tx,
            packageId: packageMeta.packageId,
            price: parsedPrice,
            adminId: params.adminId,
            note: "Cập nhật giá gói OWNER_LIFETIME từ admin",
          });
        }
      });

      await logAccountPackageEvent({
        code: params.code,
        title: parsedTitle,
        performedBy: params.adminEmail,
        detail:
          `Đã cập nhật ${previous.title}. ` +
          `Tên gói: ${previous.title} -> ${parsedTitle}. ` +
          `Giá: ${previous.price.toLocaleString("vi-VN")} -> ${parsedPrice.toLocaleString("vi-VN")} VND. ` +
          `Số lượt bán tối đa: ${(previous.maxSales ?? 0).toLocaleString("vi-VN")} -> ${parsedMaxSales.toLocaleString("vi-VN")}.`,
      });

      return this.getPackageByCode(params.code);
    }

    if (params.code === "PERSONAL_MONTHLY") {
      const previous = await this.getPackageByCode(params.code);
      const packageMeta = await findPackageBySlotCode(PERSONAL_PLAN_SLOT_CODE);
      if (!packageMeta) {
        throw new AdminAccountPackageError(
          404,
          "Chưa cấu hình gói nền cho Cá Nhân Theo Tháng.",
        );
      }
      const policy = await readSettingJson<PolicyConfig>(
        PERSONAL_POLICY_KEY,
        DEFAULTS.personal_policy,
      );
      const nextPolicy = {
        ...policy,
        planTitle: parsedTitle,
      };

      await db.transaction(async (tx) => {
        await upsertNumberSetting(
          PERSONAL_SETTING_KEY,
          parsedPrice,
          params.adminId,
        );
        await upsertJsonSetting(PERSONAL_POLICY_KEY, nextPolicy, params.adminId);

        await tx
          .update(promotionPackages)
          .set({
            promotionPackageTitle: parsedTitle,
            promotionPackageMaxPosts: parsedMaxSales,
          })
          .where(eq(promotionPackages.promotionPackageId, packageMeta.packageId));

        if (parsedPrice !== previous.price) {
          await setPackagePrice({
            tx,
            packageId: packageMeta.packageId,
            price: parsedPrice,
            adminId: params.adminId,
            note: "Cập nhật giá gói PERSONAL_MONTHLY từ admin",
          });
        }
      });

      await logAccountPackageEvent({
        code: params.code,
        title: parsedTitle,
        performedBy: params.adminEmail,
        detail:
          `Đã cập nhật ${previous.title}. ` +
          `Tên gói: ${previous.title} -> ${parsedTitle}. ` +
          `Giá: ${previous.price.toLocaleString("vi-VN")} -> ${parsedPrice.toLocaleString("vi-VN")} VND. ` +
          `Số lượt bán tối đa: ${(previous.maxSales ?? 0).toLocaleString("vi-VN")} -> ${parsedMaxSales.toLocaleString("vi-VN")}.`,
      });

      return this.getPackageByCode(params.code);
    }

    const parsedDuration =
      params.durationDays === undefined || params.durationDays === null
        ? null
        : parsePositiveInteger(params.durationDays);

    if (
      params.durationDays !== undefined &&
      params.durationDays !== null &&
      !parsedDuration
    ) {
      throw new AdminAccountPackageError(
        400,
        "Thời hạn VIP phải lớn hơn 0 ngày.",
      );
    }

    const vipPackage = await findPackageBySlotCode(SHOP_VIP_SLOT_CODE);
    if (!vipPackage) {
      throw new AdminAccountPackageError(
        404,
        "Không tìm thấy gói Nhà vườn VIP để cập nhật.",
      );
    }

    const previous = await this.getPackageByCode("SHOP_VIP");

    await db.transaction(async (tx) => {
      await upsertJsonSetting(
        SHOP_VIP_POLICY_KEY,
        {
          ...(await readSettingJson<PolicyConfig>(
            SHOP_VIP_POLICY_KEY,
            DEFAULTS.shop_vip_policy,
          )),
          planTitle: parsedTitle,
        },
        params.adminId,
      );

      await tx
        .update(promotionPackages)
        .set({
          promotionPackageTitle: parsedTitle,
          promotionPackageDurationDays:
            parsedDuration ?? vipPackage.durationDays ?? undefined,
          promotionPackageMaxPosts: parsedMaxSales,
        })
        .where(eq(promotionPackages.promotionPackageId, vipPackage.packageId));

      if (parsedPrice !== previous.price) {
        await setPackagePrice({
          tx,
          packageId: vipPackage.packageId,
          price: parsedPrice,
          adminId: params.adminId,
          note: "Cập nhật giá gói SHOP_VIP từ admin",
        });
      }
    });

    const durationDetail =
      parsedDuration && parsedDuration !== (vipPackage.durationDays ?? 0)
        ? ` Thời hạn: ${vipPackage.durationDays ?? 0} -> ${parsedDuration} ngày.`
        : "";

    await logAccountPackageEvent({
      code: "SHOP_VIP",
      title: parsedTitle,
      performedBy: params.adminEmail,
      detail:
        `Đã cập nhật ${previous.title}. ` +
        `Tên gói: ${previous.title} -> ${parsedTitle}. ` +
        `Giá: ${previous.price.toLocaleString("vi-VN")} -> ${parsedPrice.toLocaleString("vi-VN")} VND. ` +
        `Số lượt bán tối đa: ${(previous.maxSales ?? 0).toLocaleString("vi-VN")} -> ${parsedMaxSales.toLocaleString("vi-VN")}.` +
        durationDetail,
    });

    return this.getPackageByCode("SHOP_VIP");
  },
};
