import type { AdminProfile } from "./adminSession";

export const ADMIN_PORTAL_ROLE_CODES = [
  "ROLE_SUPER_ADMIN",
  "ROLE_ADMIN",
];

export type AdminModuleKey =
  | "dashboard"
  | "users"
  | "collaborators"
  | "userNotifications"
  | "activityLog"
  | "postsModeration"
  | "reportsModeration"
  | "hostContents"
  | "rolesManagement"
  | "shops"
  | "categories"
  | "attributes"
  | "categoryMapping"
  | "templates"
  | "settings"
  | "accountPackages"
  | "accountPackageTracking"
  | "placementSlots"
  | "promotionPackages"
  | "boostedPosts"
  | "promotions"
  | "analytics"
  | "aiInsights"
  | "revenue"
  | "financial"
  | "customerSpending"
  | "export";

export type AdminMenuItem = {
  label: string;
  hint: string;
  path: string;
  moduleKey: AdminModuleKey;
};

export type AdminMenuGroup = {
  id: string;
  label: string;
  description: string;
  items: AdminMenuItem[];
};

const MODULE_ROLE_MAP: Record<AdminModuleKey, string[]> = {
  dashboard: ADMIN_PORTAL_ROLE_CODES,
  users: ADMIN_PORTAL_ROLE_CODES,
  collaborators: ADMIN_PORTAL_ROLE_CODES,
  userNotifications: ADMIN_PORTAL_ROLE_CODES,
  activityLog: ADMIN_PORTAL_ROLE_CODES,
  postsModeration: ADMIN_PORTAL_ROLE_CODES,
  reportsModeration: ADMIN_PORTAL_ROLE_CODES,
  hostContents: ADMIN_PORTAL_ROLE_CODES,
  rolesManagement: ADMIN_PORTAL_ROLE_CODES,
  shops: ADMIN_PORTAL_ROLE_CODES,
  categories: ADMIN_PORTAL_ROLE_CODES,
  attributes: ADMIN_PORTAL_ROLE_CODES,
  categoryMapping: ADMIN_PORTAL_ROLE_CODES,
  templates: ADMIN_PORTAL_ROLE_CODES,
  settings: ADMIN_PORTAL_ROLE_CODES,
  accountPackages: ADMIN_PORTAL_ROLE_CODES,
  accountPackageTracking: ADMIN_PORTAL_ROLE_CODES,
  placementSlots: ADMIN_PORTAL_ROLE_CODES,
  promotionPackages: ADMIN_PORTAL_ROLE_CODES,
  boostedPosts: ADMIN_PORTAL_ROLE_CODES,
  promotions: ADMIN_PORTAL_ROLE_CODES,
  analytics: ADMIN_PORTAL_ROLE_CODES,
  aiInsights: ADMIN_PORTAL_ROLE_CODES,
  revenue: ADMIN_PORTAL_ROLE_CODES,
  financial: ADMIN_PORTAL_ROLE_CODES,
  customerSpending: ADMIN_PORTAL_ROLE_CODES,
  export: ADMIN_PORTAL_ROLE_CODES,
};

export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    id: "overview",
    label: "Tổng quan điều hành",
    description: "Theo dõi vận hành chung và quản trị tài khoản.",
    items: [
      {
        label: "Tổng quan hệ thống",
        hint: "Chỉ số chính và tình trạng toàn sàn.",
        path: "/dashboard",
        moduleKey: "dashboard",
      },
      {
        label: "Người dùng",
        hint: "Tài khoản, vai trò và trạng thái truy cập.",
        path: "/users",
        moduleKey: "users",
      },
      {
        label: "Quản lý cộng tác viên",
        hint: "Theo dõi quan hệ shop - cộng tác viên và bài gửi liên quan.",
        path: "/collaborators",
        moduleKey: "collaborators",
      },
      {
        label: "Thông báo người dùng",
        hint: "Gửi thông báo thủ công cho một người hoặc toàn bộ user.",
        path: "/user-notifications",
        moduleKey: "userNotifications",
      },
      {
        label: "Cửa hàng",
        hint: "Danh sách shop và hồ sơ kinh doanh.",
        path: "/shops",
        moduleKey: "shops",
      },
      {
        label: "Nhật ký thao tác",
        hint: "Ai làm gì và vào lúc nào.",
        path: "/activity-log",
        moduleKey: "activityLog",
      },
      {
        label: "Vai trò hệ thống",
        hint: "Quy ước vai trò dùng trong admin.",
        path: "/roles-management",
        moduleKey: "rolesManagement",
      },
    ],
  },
  {
    id: "moderation",
    label: "Kiểm duyệt nội dung",
    description: "Xử lý bài đăng và báo cáo từ người dùng.",
    items: [
      {
        label: "Duyệt bài đăng",
        hint: "Phê duyệt, từ chối và theo dõi bài chờ.",
        path: "/posts-moderation",
        moduleKey: "postsModeration",
      },
      {
        label: "Xử lý báo cáo",
        hint: "Báo cáo vi phạm, bằng chứng và kết luận.",
        path: "/reports-moderation",
        moduleKey: "reportsModeration",
      },
      {
        label: "Nội dung Host / News",
        hint: "Duyệt bài nội dung Host đang đổ sang phần News của user web.",
        path: "/host-contents",
        moduleKey: "hostContents",
      },
    ],
  },
  {
    id: "catalog",
    label: "Danh mục và biểu mẫu",
    description: "Quản lý cấu trúc dữ liệu và mẫu hiển thị.",
    items: [
      {
        label: "Danh mục sản phẩm",
        hint: "Nhóm cây cảnh và cấu trúc phân loại.",
        path: "/categories",
        moduleKey: "categories",
      },
      {
        label: "Thuộc tính dữ liệu",
        hint: "Các trường thông tin dùng cho bài đăng.",
        path: "/attributes",
        moduleKey: "attributes",
      },
      {
        label: "Ánh xạ danh mục",
        hint: "Gắn thuộc tính vào từng danh mục.",
        path: "/category-attributes",
        moduleKey: "categoryMapping",
      },
      {
        label: "Mẫu nội dung",
        hint: "Các mẫu giao diện và mẫu nhập liệu.",
        path: "/templates",
        moduleKey: "templates",
      },
    ],
  },
  {
    id: "promotion",
    label: "Quảng bá và vận hành",
    description:
      "Quản lý gói tài khoản, vị trí bài đẩy, đơn mua và chiến dịch.",
    items: [
      {
        label: "Gói tài khoản / shop",
        hint: "Chủ vườn, cá nhân và Nhà vườn VIP.",
        path: "/account-packages",
        moduleKey: "accountPackages",
      },
      {
        label: "Theo dõi gói tài khoản / shop",
        hint: "Ai đang dùng gói chủ vườn, cá nhân và VIP.",
        path: "/account-package-tracking",
        moduleKey: "accountPackageTracking",
      },
      {
        label: "Vị trí hiển thị",
        hint: "Cấu hình các vị trí bài đẩy trên trang chủ.",
        path: "/placement-slots",
        moduleKey: "placementSlots",
      },
      {
        label: "Gói quảng bá",
        hint: "Giá bán, thời lượng và hạn mức của gói đẩy bài.",
        path: "/promotion-packages",
        moduleKey: "promotionPackages",
      },
      {
        label: "Theo dõi quảng bá",
        hint: "Quota, CTR và tình trạng chạy của các lượt quảng bá.",
        path: "/boosted-posts",
        moduleKey: "boostedPosts",
      },
      {
        label: "Đơn quảng bá",
        hint: "Thanh toán, lịch chạy, đổi gói và mở lại.",
        path: "/promotions",
        moduleKey: "promotions",
      },
    ],
  },
  {
    id: "reporting",
    label: "Phân tích và doanh thu",
    description: "Theo dõi hiệu quả, doanh thu và xuất báo cáo.",
    items: [
      {
        label: "Phân tích hiệu quả",
        hint: "Hiệu suất vị trí hiển thị và lưu lượng.",
        path: "/analytics",
        moduleKey: "analytics",
      },
      {
        label: "Nhận định AI",
        hint: "Tóm tắt xu hướng và gợi ý điều hành.",
        path: "/ai-insights",
        moduleKey: "aiInsights",
      },
      {
        label: "Doanh thu",
        hint: "Theo dõi doanh thu và giao dịch thành công.",
        path: "/revenue",
        moduleKey: "revenue",
      },
      {
        label: "Tài chính / Chi trả",
        hint: "Theo dõi và xác nhận chi trả thủ công cho Host.",
        path: "/financial",
        moduleKey: "financial",
      },
      {
        label: "Chi tiêu khách hàng",
        hint: "Mức chi tiêu và giá trị đơn theo khách.",
        path: "/customer-spending",
        moduleKey: "customerSpending",
      },
      {
        label: "Xuất báo cáo",
        hint: "Tạo file tổng hợp để đối soát và lưu trữ.",
        path: "/export",
        moduleKey: "export",
      },
    ],
  },
  {
    id: "system",
    label: "Cấu hình hệ thống",
    description: "Thiết lập tham số dùng chung cho admin web.",
    items: [
      {
        label: "Thiết lập hệ thống",
        hint: "Thông số vận hành và cấu hình chung.",
        path: "/settings",
        moduleKey: "settings",
      },
    ],
  },
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

export const getVisibleAdminMenuGroups = (profile: AdminProfile | null) => {
  return ADMIN_MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      canAccessAdminModule(profile, item.moduleKey),
    ),
  })).filter((group) => group.items.length > 0);
};

export const getVisibleAdminMenuItems = (profile: AdminProfile | null) => {
  return getVisibleAdminMenuGroups(profile).flatMap((group) => group.items);
};

export const getDefaultAdminPath = (profile: AdminProfile | null) => {
  const firstVisibleItem = getVisibleAdminMenuItems(profile)[0];
  return firstVisibleItem?.path || "/dashboard";
};
