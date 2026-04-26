// Auth
export { admins, type Admin, type NewAdmin } from "./admins";
export { roles, type Role, type NewRole } from "./roles";
export {
  adminRoles,
  type AdminRole,
  type NewAdminRole,
} from "./admin-roles.ts";
export {
  businessRoles,
  type BusinessRole,
  type NewBusinessRole,
} from "./business-roles.ts";
export { users, type User, type NewUser } from "./users";
export {
  qrSessions,
  type QRSession,
  type NewQRSession,
} from "./qr-sessions.ts";
export {
  adminTemplates,
  type AdminTemplate,
  type NewAdminTemplate,
} from "./admin-templates.ts";

// Content
export { categories, type Category, type NewCategory } from "./categories";
export { attributes, type Attribute, type NewAttribute } from "./attributes";
export {
  categoryAttributes,
  type CategoryAttribute,
  type NewCategoryAttribute,
} from "./category-attributes.ts";
export {
  bannedKeywords,
  type BannedKeyword,
  type NewBannedKeyword,
} from "./banned-keywords.ts";

// Shop
export { shops, type Shop, type NewShop } from "./shops";

export {
  verifications,
  type Verification,
  type NewVerification,
} from "./verifications.ts";
export {
  shopCollaborators,
  type ShopCollaborator,
  type NewShopCollaborator,
} from "./shop-collaborators.ts";

// Posts
export { posts, type Post, type NewPost } from "./posts";
export {
  postAttributeValues,
  type PostAttributeValue,
  type NewPostAttributeValue,
} from "./post-attribute-values.ts";
export {
  mediaAssets,
  type MediaAsset,
  type NewMediaAsset,
} from "./media-assets.ts";
export {
  userFavorites,
  type UserFavorite,
  type NewUserFavorite,
} from "./user-favorites.ts";

// Tickets & Moderation
export { tickets, type Ticket, type NewTicket } from "./tickets";
// Legacy aliases for tickets
export { tickets as reports, type Ticket as Report, type Ticket as NewReport } from "./tickets";
export { tickets as operationTasks, type Ticket as OperationTask, type Ticket as NewOperationTask } from "./tickets";
export { tickets as escalations, type Ticket as Escalation, type Ticket as NewEscalation } from "./tickets";
export { tickets as jobs, type Ticket as Job, type NewTicket as NewJob } from "./tickets";

// Monetization
export {
  placementSlots,
  type PlacementSlot,
  type NewPlacementSlot,
} from "./placement-slots.ts";
export {
  promotionPackages,
  type PromotionPackage,
  type NewPromotionPackage,
} from "./promotion-packages.ts";
export {
  promotionPackagePrices,
  type PromotionPackagePrice,
  type NewPromotionPackagePrice,
} from "./promotion-package-prices.ts";
export {
  postPromotions,
  type PostPromotion,
  type NewPostPromotion,
} from "./post-promotions.ts";
export {
  transactions,
  type Transaction,
  type NewTransaction,
} from "./transactions.ts";
export {
  ledgers,
  type Ledger,
  type NewLedger,
} from "./ledgers.ts";
export {
  userPostingPlans,
  type UserPostingPlan,
  type NewUserPostingPlan,
} from "./user-posting-plans.ts";
export { taskReplies as jobContactRequests, type TaskReply as JobContactRequest, type NewTaskReply as NewJobContactRequest } from "./task-replies";
export { taskReplies as jobDeliverables, type TaskReply as JobDeliverable, type NewTaskReply as NewJobDeliverable } from "./task-replies";

// Analytics
export {
  dailyPlacementMetrics,
  type DailyPlacementMetric,
  type NewDailyPlacementMetric,
} from "./daily-placement-metrics.ts";
export {
  trendScores,
  type TrendScore,
  type NewTrendScore,
} from "./trend-scores.ts";
export {
  aiInsights,
  type AiInsight,
  type NewAiInsight,
} from "./ai-insights.ts";
export { eventLogs, type EventLog, type NewEventLog } from "./event-logs";

// Manager & Operations
// Manager & Operations
export {
  taskReplies,
  type TaskReply,
  type NewTaskReply,
} from "./task-replies.ts";
export {
  notifications,
  type Notification,
  type NewNotification,
} from "./notifications.ts";
// Escalations (Handled by tickets alias)

// Host
export {
  hostContents,
  type HostContent,
  type NewHostContent,
} from "./host-contents.ts";

// System
export {
  systemSettings,
  type SystemSetting,
  type NewSystemSetting,
} from "./system-settings.ts";
