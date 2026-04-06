import type { AdminProfile } from "./adminSession";

export const ADMIN_PORTAL_ROLE_CODES = [
  "ROLE_SUPER_ADMIN",
  "ROLE_ADMIN",
  "ROLE_MODERATOR",
  "ROLE_SUPPORT",
  "ROLE_FINANCE",
];

export type AdminModuleKey =
  | "dashboard"
  | "users"
  | "activityLog"
  | "postsModeration"
  | "reportsModeration"
  | "rolesManagement"
  | "shops"
  | "categories"
  | "attributes"
  | "categoryMapping"
  | "templates"
  | "templateBuilder"
  | "settings"
  | "placementSlots"
  | "promotionPackages"
  | "boostedPosts"
  | "promotions"
  | "analytics"
  | "aiInsights"
  | "revenue"
  | "customerSpending"
  | "export";

export type AdminMenuItem = {
  label: string;
  path: string;
  moduleKey: AdminModuleKey;
};

const MODULE_ROLE_MAP: Record<AdminModuleKey, string[]> = {
  dashboard: ADMIN_PORTAL_ROLE_CODES,
  users: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPPORT"],
  activityLog: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPPORT"],
  postsModeration: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"],
  reportsModeration: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"],
  rolesManagement: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  shops: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"],
  categories: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  attributes: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  categoryMapping: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  templates: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  templateBuilder: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  settings: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  placementSlots: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  promotionPackages: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  boostedPosts: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  promotions: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  analytics: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  aiInsights: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
  revenue: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCE"],
  customerSpending: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCE"],
  export: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCE"],
};

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { label: "Dashboard", path: "/dashboard", moduleKey: "dashboard" },
  { label: "Users", path: "/users", moduleKey: "users" },
  { label: "Activity Log", path: "/activity-log", moduleKey: "activityLog" },
  {
    label: "Posts Moderation",
    path: "/posts-moderation",
    moduleKey: "postsModeration",
  },
  {
    label: "Reports Moderation",
    path: "/reports-moderation",
    moduleKey: "reportsModeration",
  },
  {
    label: "Roles Management",
    path: "/roles-management",
    moduleKey: "rolesManagement",
  },
  { label: "Shops", path: "/shops", moduleKey: "shops" },
  { label: "Categories", path: "/categories", moduleKey: "categories" },
  { label: "Attributes", path: "/attributes", moduleKey: "attributes" },
  {
    label: "Category Mapping",
    path: "/category-attributes",
    moduleKey: "categoryMapping",
  },
  { label: "Templates", path: "/templates", moduleKey: "templates" },
  {
    label: "Template Builder",
    path: "/template-builder",
    moduleKey: "templateBuilder",
  },
  { label: "Settings", path: "/settings", moduleKey: "settings" },
  {
    label: "Placement Slots",
    path: "/placement-slots",
    moduleKey: "placementSlots",
  },
  {
    label: "Promotion Packages",
    path: "/promotion-packages",
    moduleKey: "promotionPackages",
  },
  {
    label: "Boosted Posts",
    path: "/boosted-posts",
    moduleKey: "boostedPosts",
  },
  { label: "Promotions", path: "/promotions", moduleKey: "promotions" },
  { label: "Analytics", path: "/analytics", moduleKey: "analytics" },
  { label: "AI Insights", path: "/ai-insights", moduleKey: "aiInsights" },
  { label: "Revenue", path: "/revenue", moduleKey: "revenue" },
  {
    label: "Customer Spending",
    path: "/customer-spending",
    moduleKey: "customerSpending",
  },
  { label: "Export CSV", path: "/export", moduleKey: "export" },
];

const getRoleCodes = (profile: AdminProfile | null) => profile?.roleCodes ?? [];

export const canAccessAdminPortal = (profile: AdminProfile | null) => {
  return getRoleCodes(profile).some((code) =>
    ADMIN_PORTAL_ROLE_CODES.includes(code),
  );
};

export const canAccessAdminModule = (
  profile: AdminProfile | null,
  moduleKey: AdminModuleKey,
) => {
  return getRoleCodes(profile).some((code) =>
    MODULE_ROLE_MAP[moduleKey].includes(code),
  );
};

export const getVisibleAdminMenuItems = (profile: AdminProfile | null) => {
  return ADMIN_MENU_ITEMS.filter((item) =>
    canAccessAdminModule(profile, item.moduleKey),
  );
};

export const getDefaultAdminPath = (profile: AdminProfile | null) => {
  const firstVisibleItem = getVisibleAdminMenuItems(profile)[0];
  return firstVisibleItem?.path || "/dashboard";
};
