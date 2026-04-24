/**
 * Route Rules Definition
 * Centralized whitelist management for user-web navigation.
 * 
 * Rules:
 * - requiresAuth: User must be logged in.
 * - requiresShop: User must own an active shop profile.
 * - requiresNoShop: User must NOT have an active shop (e.g., individual dashboards).
 * - allowedRoles: List of business role codes (e.g., ["COLLABORATOR", "HOST"]).
 */

export interface RouteRule {
  pathPattern: string | RegExp;
  rules: {
    requiresAuth?: boolean;
    requiresShop?: boolean;
    requiresNoShop?: boolean;
    allowedRoles?: string[];
    deniedMessage?: string;
  };
}

export const RESTRICTED_ROLES_ON_WEB = ["COLLABORATOR", "HOST", "MANAGER", "OPERATION_STAFF"];

export const routeRules: RouteRule[] = [
  // 1. Garden Owner Managed Routes
  {
    pathPattern: /^\/owner-dashboard(\/.*)?$/,
    rules: {
      requiresAuth: true,
      requiresShop: true,
      deniedMessage: "Trang này yêu cầu hồ sơ Nhà vườn đang hoạt động."
    }
  },
  {
    pathPattern: "/collaborator/directory",
    rules: {
      requiresAuth: true,
      requiresShop: true,
      deniedMessage: "Chỉ chủ vườn mới có quyền khám phá danh sách Cộng tác viên."
    }
  },

  // 2. Individual User Routes (Excludes Owners)
  {
    pathPattern: "/personal-dashboard",
    rules: {
      requiresAuth: true,
      requiresNoShop: true,
      deniedMessage: "Đây là trang cho tài khoản cá nhân. Chủ vườn vui lòng sử dụng bảng điều khiển nhà vườn."
    }
  },
  {
    pathPattern: "/register-shop",
    rules: {
      requiresAuth: true,
      requiresNoShop: true,
      deniedMessage: "Bạn đã có hồ sơ Nhà vườn. Không thể thực hiện đăng ký mới."
    }
  },

  // 3. Common Protected Routes
  {
    pathPattern: "/profile",
    rules: { requiresAuth: true }
  },
  {
    pathPattern: "/my-posts",
    rules: { requiresAuth: true }
  },
  {
    pathPattern: "/create-post",
    rules: { requiresAuth: true }
  },
  {
    pathPattern: "/saved-posts",
    rules: { requiresAuth: true }
  },
  {
    pathPattern: "/news/bookmarks",
    rules: { requiresAuth: true }
  }
];

/**
 * Utility to match a path against the whitelist rules
 */
export const getRuleForPath = (path: string): RouteRule['rules'] | null => {
  const rule = routeRules.find(r => {
    if (typeof r.pathPattern === 'string') {
      return r.pathPattern === path;
    }
    return r.pathPattern.test(path);
  });
  return rule ? rule.rules : null;
};
