import {
  and,
  desc,
  eq,
  gte,
  lt,
  lte,
  sql,
} from "drizzle-orm";
import { db } from "../config/db.ts";
import {
  postingFeeLedger,
  posts,
  shops,
  userPostingPlans,
} from "../models/schema/index.ts";

export const POSTING_PLAN_CODES = {
  STANDARD: "STANDARD",
  GARDEN_OWNER_LIFETIME: "GARDEN_OWNER_LIFETIME",
  PERSONAL_MONTHLY: "PERSONAL_MONTHLY",
} as const;

type PostingPlanCode =
  (typeof POSTING_PLAN_CODES)[keyof typeof POSTING_PLAN_CODES];

type PostingPolicySource = "shop" | "subscription" | "default";

type BasePostingPolicy = {
  planCode: PostingPlanCode;
  planTitle: string;
  autoApprove: boolean;
  dailyPostLimit: number | null;
  postFeeAmount: number;
  freeEditQuota: number;
  editFeeAmount: number;
};

export type EffectivePostingPolicy = BasePostingPolicy & {
  source: PostingPolicySource;
  activePlanId: number | null;
};

export type PostingPolicySnapshot = {
  policy: EffectivePostingPolicy;
  usage: {
    dailyPostsUsed: number;
    dailyPostsRemaining: number | null;
    totalTrackedFees: number;
  };
};

export type PostingFeeRecord = {
  postingFeeId: number;
  actionType: string;
  amount: number;
  createdAt: Date | null;
};
import { readSettingJson } from "../controllers/user/pricing-config.controller.ts";

const OWNER_LIFETIME_DEFAULT_POLICY: BasePostingPolicy = {
  planCode: POSTING_PLAN_CODES.GARDEN_OWNER_LIFETIME,
  planTitle: "Gói Chủ Vườn Vĩnh Viễn",
  autoApprove: true,
  dailyPostLimit: 20,
  postFeeAmount: 20000,
  freeEditQuota: 4,
  editFeeAmount: 5000,
};

const getOwnerPolicy = async (): Promise<BasePostingPolicy> =>
  readSettingJson("owner_posting_policy", OWNER_LIFETIME_DEFAULT_POLICY);

const PERSONAL_MONTHLY_DEFAULT_POLICY: BasePostingPolicy = {
  planCode: POSTING_PLAN_CODES.PERSONAL_MONTHLY,
  planTitle: "Gói Cá Nhân Theo Tháng",
  autoApprove: true,
  dailyPostLimit: 20,
  postFeeAmount: 0,
  freeEditQuota: 4,
  editFeeAmount: 5000,
};

const getPersonalPolicy = async (): Promise<BasePostingPolicy> =>
  readSettingJson("personal_posting_policy", PERSONAL_MONTHLY_DEFAULT_POLICY);

const STANDARD_DEFAULT_POLICY: BasePostingPolicy = {
  planCode: POSTING_PLAN_CODES.STANDARD,
  planTitle: "Tài Khoản Cơ Bản",
  autoApprove: false,
  dailyPostLimit: null,
  postFeeAmount: 0,
  freeEditQuota: 0,
  editFeeAmount: 0,
};

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDateWindow = (referenceDate: Date) => {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const buildPolicyFromSubscription = (
  row: typeof userPostingPlans.$inferSelect,
  defaultPolicy: BasePostingPolicy,
): BasePostingPolicy => ({
  planCode: POSTING_PLAN_CODES.PERSONAL_MONTHLY,
  planTitle: row.postingPlanTitle || defaultPolicy.planTitle,
  autoApprove:
    row.postingPlanAutoApprove ??
    defaultPolicy.autoApprove,
  dailyPostLimit:
    row.postingPlanDailyPostLimit ??
    defaultPolicy.dailyPostLimit,
  postFeeAmount: toSafeNumber(row.postingPlanPostFeeAmount),
  freeEditQuota:
    row.postingPlanFreeEditQuota ??
    defaultPolicy.freeEditQuota,
  editFeeAmount: toSafeNumber(row.postingPlanEditFeeAmount),
});

const getActivePersonalMonthlyPlan = async (userId: number) => {
  const now = new Date();
  const [plan] = await db
    .select()
    .from(userPostingPlans)
    .where(
      and(
        eq(userPostingPlans.postingPlanUserId, userId),
        eq(userPostingPlans.postingPlanCode, POSTING_PLAN_CODES.PERSONAL_MONTHLY),
        eq(userPostingPlans.postingPlanStatus, "active"),
        lte(userPostingPlans.postingPlanStartedAt, now),
        orPlanNotExpired(now),
      ),
    )
    .orderBy(desc(userPostingPlans.postingPlanCreatedAt))
    .limit(1);

  return plan ?? null;
};

const orPlanNotExpired = (now: Date) =>
  sql<boolean>`(${userPostingPlans.postingPlanExpiresAt} is null or ${userPostingPlans.postingPlanExpiresAt} > ${now})`;

const getTotalTrackedFees = async (userId: number): Promise<number> => {
  const [row] = await db
    .select({
      totalFees: sql<string>`coalesce(sum(${postingFeeLedger.postingFeeTotalAmount}), 0)`,
    })
    .from(postingFeeLedger)
    .where(eq(postingFeeLedger.postingFeeUserId, userId));

  return toSafeNumber(row?.totalFees ?? 0);
};

const getTodayPostUsage = async (
  userId: number,
  referenceDate = new Date(),
): Promise<number> => {
  const { start, end } = getDateWindow(referenceDate);
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(posts)
    .where(
      and(
        eq(posts.postAuthorId, userId),
        gte(posts.postCreatedAt, start),
        lt(posts.postCreatedAt, end),
      ),
    );

  return toSafeNumber(row?.total ?? 0);
};

export class PostingPolicyError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const postingPolicyService = {
  async getEffectivePolicy(userId: number): Promise<EffectivePostingPolicy> {
    const [activeShop] = await db
      .select({
        shopId: shops.shopId,
      })
      .from(shops)
      .where(and(eq(shops.shopId, userId), eq(shops.shopStatus, "active")))
      .limit(1);

    if (activeShop) {
      const ownerPolicy = await getOwnerPolicy();
      return {
        ...ownerPolicy,
        source: "shop",
        activePlanId: null,
      };
    }

    const activePersonalPlan = await getActivePersonalMonthlyPlan(userId);
    if (activePersonalPlan) {
      const personalPolicy = await getPersonalPolicy();
      return {
        ...buildPolicyFromSubscription(activePersonalPlan, personalPolicy),
        source: "subscription",
        activePlanId: activePersonalPlan.postingPlanId,
      };
    }

    return {
      ...STANDARD_DEFAULT_POLICY,
      source: "default",
      activePlanId: null,
    };
  },

  async getPolicySnapshot(userId: number): Promise<PostingPolicySnapshot> {
    const policy = await this.getEffectivePolicy(userId);
    const dailyPostsUsed = await getTodayPostUsage(userId);
    const dailyPostsRemaining =
      policy.dailyPostLimit === null
        ? null
        : Math.max(policy.dailyPostLimit - dailyPostsUsed, 0);
    const totalTrackedFees = await getTotalTrackedFees(userId);

    return {
      policy,
      usage: {
        dailyPostsUsed,
        dailyPostsRemaining,
        totalTrackedFees,
      },
    };
  },

  async assertCanCreatePost(userId: number): Promise<PostingPolicySnapshot> {
    const snapshot = await this.getPolicySnapshot(userId);
    const limit = snapshot.policy.dailyPostLimit;

    if (limit !== null && snapshot.usage.dailyPostsUsed >= limit) {
      throw new PostingPolicyError(
        429,
        "DAILY_POST_LIMIT_REACHED",
        `You have reached the daily post limit (${limit} posts/day) for your current plan.`,
        {
          dailyPostLimit: limit,
          dailyPostsUsed: snapshot.usage.dailyPostsUsed,
        },
      );
    }

    return snapshot;
  },

  getEditPricing(policy: EffectivePostingPolicy, currentEditCount: number) {
    const nextEditCount = Math.max(0, currentEditCount) + 1;
    const chargeAmount =
      nextEditCount > policy.freeEditQuota ? policy.editFeeAmount : 0;
    const remainingFreeEdits = Math.max(policy.freeEditQuota - nextEditCount, 0);

    return {
      nextEditCount,
      chargeAmount,
      remainingFreeEdits,
    };
  },

  async addFeeLedgerEntry(params: {
    userId: number;
    postId: number;
    planId?: number | null;
    actionType: "POST_CREATE" | "POST_EDIT";
    amount: number;
    note?: string;
  }): Promise<PostingFeeRecord | null> {
    const amount = Math.max(0, Math.round(params.amount));
    if (amount <= 0) {
      return null;
    }

    const [row] = await db
      .insert(postingFeeLedger)
      .values({
        postingFeeUserId: params.userId,
        postingFeePostId: params.postId,
        postingFeePlanId: params.planId ?? null,
        postingFeeActionType: params.actionType,
        postingFeeQuantity: 1,
        postingFeeUnitAmount: String(amount),
        postingFeeTotalAmount: String(amount),
        postingFeeCurrency: "VND",
        postingFeeNote: params.note ?? null,
      })
      .returning({
        postingFeeId: postingFeeLedger.postingFeeId,
        actionType: postingFeeLedger.postingFeeActionType,
        totalAmount: postingFeeLedger.postingFeeTotalAmount,
        createdAt: postingFeeLedger.postingFeeCreatedAt,
      });

    if (!row) {
      return null;
    }

    return {
      postingFeeId: row.postingFeeId,
      actionType: row.actionType,
      amount: toSafeNumber(row.totalAmount),
      createdAt: row.createdAt ?? null,
    };
  },

  async activatePersonalMonthlyPlan(params: {
    userId: number;
    durationDays: number;
  }) {
    const { userId } = params;
    const durationDays = Math.min(Math.max(Math.floor(params.durationDays), 7), 365);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await db
      .update(userPostingPlans)
      .set({
        postingPlanStatus: "expired",
        postingPlanUpdatedAt: now,
        postingPlanExpiresAt: now,
      })
      .where(
        and(
          eq(userPostingPlans.postingPlanUserId, userId),
          eq(userPostingPlans.postingPlanCode, POSTING_PLAN_CODES.PERSONAL_MONTHLY),
          eq(userPostingPlans.postingPlanStatus, "active"),
          orPlanNotExpired(now),
        ),
      );

    const personalPolicy = await getPersonalPolicy();
    const [createdPlan] = await db
      .insert(userPostingPlans)
      .values({
        postingPlanUserId: userId,
        postingPlanCode: POSTING_PLAN_CODES.PERSONAL_MONTHLY,
        postingPlanTitle: personalPolicy.planTitle,
        postingPlanCycle: "monthly",
        postingPlanStatus: "active",
        postingPlanAutoApprove: personalPolicy.autoApprove,
        postingPlanDailyPostLimit: personalPolicy.dailyPostLimit,
        postingPlanPostFeeAmount: String(
          personalPolicy.postFeeAmount,
        ),
        postingPlanFreeEditQuota: personalPolicy.freeEditQuota,
        postingPlanEditFeeAmount: String(
          personalPolicy.editFeeAmount,
        ),
        postingPlanStartedAt: now,
        postingPlanExpiresAt: expiresAt,
        postingPlanCreatedAt: now,
        postingPlanUpdatedAt: now,
      })
      .returning();

    return {
      plan: createdPlan,
      effectivePolicy: {
        ...personalPolicy,
        source: "subscription" as const,
        activePlanId: createdPlan?.postingPlanId ?? null,
      },
    };
  },
};
