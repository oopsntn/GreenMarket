import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "../config/db.ts";
import {
  PERSONAL_PLAN_SLOT_CODE,
  SHOP_REGISTRATION_SLOT_CODE,
  SHOP_VIP_SLOT_CODE,
} from "../constants/promotion.ts";
import {
  shops,
  userPostingPlans,
  users,
} from "../models/schema/index.ts";
import {
  adminAccountPackageService,
  type AccountPackageCode,
} from "./adminAccountPackage.service.ts";
import { POSTING_PLAN_CODES } from "./posting-policy.service";

type TrackingStatus = "permanent" | "active" | "expiring_soon";

export type AdminAccountPackageTrackingRow = {
  id: string;
  packageCode: AccountPackageCode;
  packageTitle: string;
  packageGroupLabel: string;
  cycleLabel: string;
  scopeLabel: string;
  holderName: string;
  accountName: string | null;
  holderTypeLabel: "Shop" | "Người dùng";
  userId: number;
  shopId: number | null;
  phone: string | null;
  email: string | null;
  startedAt: Date | null;
  expiresAt: Date | null;
  status: TrackingStatus;
  statusLabel: string;
  note: string;
};

export type AdminAccountPackageTrackingSummary = {
  totalTracked: number;
  accountTracked: number;
  shopTracked: number;
  expiringSoon: number;
};

export type AdminAccountPackageTrackingPayload = {
  summary: AdminAccountPackageTrackingSummary;
  rows: AdminAccountPackageTrackingRow[];
};

const EXPIRING_SOON_DAYS = 7;

const buildStatus = (expiresAt: Date | null): Pick<
  AdminAccountPackageTrackingRow,
  "status" | "statusLabel"
> => {
  if (!expiresAt) {
    return {
      status: "permanent",
      statusLabel: "Vĩnh viễn",
    };
  }

  const now = new Date();
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() + EXPIRING_SOON_DAYS);

  if (expiresAt <= threshold) {
    return {
      status: "expiring_soon",
      statusLabel: "Sắp hết hạn",
    };
  }

  return {
    status: "active",
    statusLabel: "Đang hiệu lực",
  };
};

export const adminAccountPackageTrackingService = {
  async getTracking(): Promise<AdminAccountPackageTrackingPayload> {
    const catalog = await adminAccountPackageService.getCatalog();

    const catalogMap = new Map(catalog.map((item) => [item.code, item]));
    const ownerPackage = catalogMap.get("OWNER_LIFETIME");
    const personalPackage = catalogMap.get("PERSONAL_MONTHLY");
    const vipPackage = catalogMap.get("SHOP_VIP");

    if (!ownerPackage || !personalPackage || !vipPackage) {
      throw new Error("Không thể khởi tạo dữ liệu theo dõi gói tài khoản / shop.");
    }

    const now = new Date();

    const [activeShops, activePersonalPlans, activeVipShops] = await Promise.all([
      db
        .select({
          shopId: shops.shopId,
          shopName: shops.shopName,
          shopPhone: shops.shopPhone,
          shopEmail: shops.shopEmail,
          shopCreatedAt: shops.shopCreatedAt,
          userId: users.userId,
          userDisplayName: users.userDisplayName,
        })
        .from(shops)
        .innerJoin(users, eq(shops.shopId, users.userId))
        .where(eq(shops.shopStatus, "active"))
        .orderBy(desc(shops.shopCreatedAt)),
      db
        .select({
          planId: userPostingPlans.postingPlanId,
          userId: userPostingPlans.postingPlanUserId,
          planStartedAt: userPostingPlans.postingPlanStartedAt,
          planExpiresAt: userPostingPlans.postingPlanExpiresAt,
          userDisplayName: users.userDisplayName,
          userMobile: users.userMobile,
          userEmail: users.userEmail,
        })
        .from(userPostingPlans)
        .innerJoin(users, eq(userPostingPlans.postingPlanUserId, users.userId))
        .where(
          and(
            eq(
              userPostingPlans.postingPlanCode,
              POSTING_PLAN_CODES.PERSONAL_MONTHLY,
            ),
            eq(userPostingPlans.postingPlanStatus, "active"),
            gt(userPostingPlans.postingPlanExpiresAt, now),
          ),
        )
        .orderBy(desc(userPostingPlans.postingPlanStartedAt)),
      db
        .select({
          shopId: shops.shopId,
          shopName: shops.shopName,
          shopPhone: shops.shopPhone,
          shopEmail: shops.shopEmail,
          shopVipStartedAt: shops.shopVipStartedAt,
          shopVipExpiresAt: shops.shopVipExpiresAt,
          userId: users.userId,
          userDisplayName: users.userDisplayName,
        })
        .from(shops)
        .innerJoin(users, eq(shops.shopId, users.userId))
        .where(gt(shops.shopVipExpiresAt, now))
        .orderBy(desc(shops.shopVipExpiresAt)),
    ]);

    const rows: AdminAccountPackageTrackingRow[] = [];

    for (const item of activeShops) {
      const status = buildStatus(null);

      rows.push({
        id: `owner-${item.shopId}`,
        packageCode: "OWNER_LIFETIME",
        packageTitle: ownerPackage.title,
        packageGroupLabel: ownerPackage.groupLabel,
        cycleLabel: ownerPackage.cycleLabel,
        scopeLabel: ownerPackage.scopeLabel,
        holderName: item.shopName,
        accountName: item.userDisplayName?.trim() || null,
        holderTypeLabel: "Shop",
        userId: item.userId,
        shopId: item.shopId,
        phone: item.shopPhone ?? null,
        email: item.shopEmail ?? null,
        startedAt: item.shopCreatedAt ?? null,
        expiresAt: null,
        status: status.status,
        statusLabel: status.statusLabel,
        note: "Shop đang active; gói chủ vườn không có ngày hết hạn.",
      });
    }

    for (const item of activePersonalPlans) {
      const status = buildStatus(item.planExpiresAt ?? null);

      rows.push({
        id: `personal-${item.planId}`,
        packageCode: "PERSONAL_MONTHLY",
        packageTitle: personalPackage.title,
        packageGroupLabel: personalPackage.groupLabel,
        cycleLabel: personalPackage.cycleLabel,
        scopeLabel: personalPackage.scopeLabel,
        holderName:
          item.userDisplayName?.trim() || `Người dùng #${item.userId}`,
        accountName: item.userDisplayName?.trim() || null,
        holderTypeLabel: "Người dùng",
        userId: item.userId,
        shopId: null,
        phone: item.userMobile ?? null,
        email: item.userEmail ?? null,
        startedAt: item.planStartedAt ?? null,
        expiresAt: item.planExpiresAt ?? null,
        status: status.status,
        statusLabel: status.statusLabel,
        note: "Đang dùng gói cá nhân theo tháng từ user_posting_plans.",
      });
    }

    for (const item of activeVipShops) {
      const status = buildStatus(item.shopVipExpiresAt ?? null);

      rows.push({
        id: `vip-${item.shopId}`,
        packageCode: "SHOP_VIP",
        packageTitle: vipPackage.title,
        packageGroupLabel: vipPackage.groupLabel,
        cycleLabel: vipPackage.cycleLabel,
        scopeLabel: vipPackage.scopeLabel,
        holderName: item.shopName,
        accountName: item.userDisplayName?.trim() || null,
        holderTypeLabel: "Shop",
        userId: item.userId,
        shopId: item.shopId,
        phone: item.shopPhone ?? null,
        email: item.shopEmail ?? null,
        startedAt: item.shopVipStartedAt ?? null,
        expiresAt: item.shopVipExpiresAt ?? null,
        status: status.status,
        statusLabel: status.statusLabel,
        note: "VIP chỉ ảnh hưởng thứ tự shop trong Danh sách nhà vườn.",
      });
    }

    const packageOrder: Record<AccountPackageCode, number> = {
      OWNER_LIFETIME: 1,
      PERSONAL_MONTHLY: 2,
      SHOP_VIP: 3,
    };

    rows.sort((left, right) => {
      const packageDiff =
        packageOrder[left.packageCode] - packageOrder[right.packageCode];

      if (packageDiff !== 0) {
        return packageDiff;
      }

      const leftTime =
        left.expiresAt?.getTime() ??
        left.startedAt?.getTime() ??
        0;
      const rightTime =
        right.expiresAt?.getTime() ??
        right.startedAt?.getTime() ??
        0;

      return rightTime - leftTime;
    });

    const summary: AdminAccountPackageTrackingSummary = {
      totalTracked: rows.length,
      accountTracked: rows.filter((item) => item.packageCode !== "SHOP_VIP").length,
      shopTracked: rows.filter((item) => item.holderTypeLabel === "Shop").length,
      expiringSoon: rows.filter((item) => item.status === "expiring_soon").length,
    };

    return {
      summary,
      rows,
    };
  },
};

