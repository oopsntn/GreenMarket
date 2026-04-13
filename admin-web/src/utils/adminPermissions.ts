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
  { label: "Tổng quan", path: "/dashboard", moduleKey: "dashboard" },
  { label: "Người dùng", path: "/users", moduleKey: "users" },
  { label: "Nhật ký hoạt động", path: "/activity-log", moduleKey: "activityLog" },
  {
    label: "Kiểm duyệt bài đăng",
    path: "/posts-moderation",
    moduleKey: "postsModeration",
  },
  {
    label: "Kiểm duyệt báo cáo",
    path: "/reports-moderation",
    moduleKey: "reportsModeration",
  },
  {
    label: "Quản lý vai trò",
    path: "/roles-management",
    moduleKey: "rolesManagement",
  },
  { label: "Cửa hàng", path: "/shops", moduleKey: "shops" },
  { label: "Danh mục", path: "/categories", moduleKey: "categories" },
  { label: "Thuộc tính", path: "/attributes", moduleKey: "attributes" },
  {
    label: "Ánh xạ danh mục",
    path: "/category-attributes",
    moduleKey: "categoryMapping",
  },
  { label: "Mẫu nội dung", path: "/templates", moduleKey: "templates" },
  {
    label: "Trình dựng mẫu",
    path: "/template-builder",
    moduleKey: "templateBuilder",
  },
  { label: "Thiết lập hệ thống", path: "/settings", moduleKey: "settings" },
  {
    label: "Vị trí hiển thị",
    path: "/placement-slots",
    moduleKey: "placementSlots",
  },
  {
    label: "Gói quảng bá",
    path: "/promotion-packages",
    moduleKey: "promotionPackages",
  },
  {
    label: "Chiến dịch quảng bá",
    path: "/boosted-posts",
    moduleKey: "boostedPosts",
  },
  { label: "Khuyến mãi", path: "/promotions", moduleKey: "promotions" },
  { label: "Phân tích", path: "/analytics", moduleKey: "analytics" },
  { label: "Phân tích AI", path: "/ai-insights", moduleKey: "aiInsights" },
  { label: "Doanh thu", path: "/revenue", moduleKey: "revenue" },
  {
    label: "Chi tiêu khách hàng",
    path: "/customer-spending",
    moduleKey: "customerSpending",
  },
  { label: "Xuất dữ liệu", path: "/export", moduleKey: "export" },
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
