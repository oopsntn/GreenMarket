import { apiClient } from "../lib/apiClient";
import { roleManagementService } from "./roleManagementService";
import type {
  ApiUserResponse,
  AssignableUserRole,
  FlattenedUserActivityItem,
  RoleAssignmentHistoryItem,
  User,
  UserActivityLogItem,
  UserRole,
  UserRoleCountItem,
  UserStatus,
  UserSummaryCard,
} from "../types/user";

const DEFAULT_ADMIN_NAME = "Quản trị viên hệ thống";

const padNumber = (value: number) => String(value).padStart(2, "0");

const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = padNumber(now.getMonth() + 1);
  const day = padNumber(now.getDate());

  return `${year}-${month}-${day}`;
};

const formatDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const mapApiStatusToUiStatus = (value: string | null): UserStatus => {
  return value?.toLowerCase() === "blocked" ? "Locked" : "Active";
};

const mapBusinessRoleCodeToUiRole = (
  code: string | null | undefined,
): AssignableUserRole => {
  switch (code) {
    case "HOST":
      return "Host";
    case "COLLABORATOR":
      return "Collaborator";
    case "MANAGER":
      return "Manager";
    case "OPERATION_STAFF":
      return "Operation Staff";
    case "USER":
    default:
      return "User";
  }
};

const mapUiRoleToBusinessRoleCode = (role: AssignableUserRole): string => {
  switch (role) {
    case "Host":
      return "HOST";
    case "Collaborator":
      return "COLLABORATOR";
    case "Manager":
      return "MANAGER";
    case "Operation Staff":
      return "OPERATION_STAFF";
    case "User":
    default:
      return "USER";
  }
};

const mapRoleLabelToUiRole = (roleLabel: string | null | undefined): UserRole | null => {
  if (!roleLabel?.trim()) {
    return null;
  }

  const normalized = roleLabel.trim().toLowerCase();

  if (normalized.includes("operation")) return "Operation Staff";
  if (normalized.includes("manager") || normalized.includes("quản lý"))
    return "Manager";
  if (normalized.includes("collaborator") || normalized.includes("cộng tác"))
    return "Collaborator";
  if (normalized.includes("host")) return "Host";
  return "User";
};

const buildFallbackRoleHistory = (
  user: ApiUserResponse,
  role: AssignableUserRole,
): RoleAssignmentHistoryItem[] => {
  const assignedAt =
    formatDateTime(user.userUpdatedAt || user.userCreatedAt) || getCurrentDate();

  return [
    {
      id: 1,
      previousRole: null,
      role,
      assignedBy: DEFAULT_ADMIN_NAME,
      assignedAt,
      note: user.businessRoleTitle
        ? `Vai trò hiện tại là ${user.businessRoleTitle}.`
        : "Người dùng chưa được gán vai trò nghiệp vụ.",
    },
  ];
};

const buildRoleAssignmentHistory = (
  user: ApiUserResponse,
  role: AssignableUserRole,
): RoleAssignmentHistoryItem[] => {
  if (!user.roleHistory || user.roleHistory.length === 0) {
    return buildFallbackRoleHistory(user, role);
  }

  return user.roleHistory.map((item) => ({
    id: item.id,
    previousRole: mapRoleLabelToUiRole(item.previousRole),
    role: mapRoleLabelToUiRole(item.nextRole) ?? role,
    assignedBy: item.assignedBy || DEFAULT_ADMIN_NAME,
    assignedAt: formatDateTime(item.assignedAt) || getCurrentDate(),
    note: item.note || "Cập nhật vai trò nghiệp vụ.",
  }));
};

const buildFallbackActivityLogs = (
  user: ApiUserResponse,
  displayName: string,
): UserActivityLogItem[] => {
  const registrationDateTime = formatDateTime(
    user.userRegisteredAt || user.userCreatedAt,
  );
  const lastLoginDateTime = formatDateTime(user.userLastLoginAt);
  const logs: UserActivityLogItem[] = [];

  if (registrationDateTime) {
    logs.push({
      id: 1,
      action: "Tạo tài khoản",
      detail: "Tài khoản người dùng đã được tạo trong hệ thống marketplace.",
      performedBy: "Hệ thống",
      performedAt: registrationDateTime,
    });
  }

  if (lastLoginDateTime) {
    logs.push({
      id: logs.length + 1,
      action: "Ghi nhận đăng nhập",
      detail: "Hệ thống đã ghi nhận lần đăng nhập thành công gần nhất.",
      performedBy: displayName,
      performedAt: lastLoginDateTime,
    });
  }

  return logs.sort((a, b) => b.performedAt.localeCompare(a.performedAt));
};

const buildActivityLogs = (
  user: ApiUserResponse,
  displayName: string,
): UserActivityLogItem[] => {
  if (!user.activityHistory || user.activityHistory.length === 0) {
    return buildFallbackActivityLogs(user, displayName);
  }

  return user.activityHistory
    .map((item) => ({
      id: item.id,
      action: item.action || "Hoạt động hệ thống",
      detail: item.detail || "Không có chi tiết.",
      performedBy: item.performedBy || DEFAULT_ADMIN_NAME,
      performedAt: formatDateTime(item.performedAt) || getCurrentDate(),
      reason: item.reason ?? null,
    }))
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
};

const mapApiUserToUi = (item: ApiUserResponse): User => {
  const fullName =
    item.userDisplayName?.trim() ||
    item.userEmail?.trim() ||
    item.userMobile?.trim() ||
    `Người dùng #${item.userId}`;

  const role = mapBusinessRoleCodeToUiRole(item.businessRoleCode);

  return {
    id: item.userId,
    fullName,
    phone: item.userMobile?.trim() || "Không có số điện thoại",
    email: item.userEmail?.trim() || "Chưa có email",
    role,
    status: mapApiStatusToUiStatus(item.userStatus),
    joinedAt: formatDate(item.userRegisteredAt || item.userCreatedAt),
    location: item.userLocation?.trim() || "Chưa có địa chỉ",
    lastLoginAt: formatDateTime(item.userLastLoginAt) || "Chưa đăng nhập",
    roleAssignments: buildRoleAssignmentHistory(item, role),
    activityLogs: buildActivityLogs(item, fullName),
    businessRoleId: item.businessRoleId ?? item.userBusinessRoleId ?? null,
    businessRoleCode: item.businessRoleCode ?? null,
    businessRoleTitle: item.businessRoleTitle ?? null,
  };
};

export const userService = {
  async fetchUsers(): Promise<User[]> {
    const data = await apiClient.request<ApiUserResponse[]>("/api/admin/users", {
      defaultErrorMessage: "Không thể tải danh sách người dùng.",
    });

    return data.map(mapApiUserToUi);
  },

  async fetchUserById(userId: number): Promise<User> {
    const data = await apiClient.request<ApiUserResponse>(
      `/api/admin/users/${userId}`,
      {
        defaultErrorMessage: "Không thể tải chi tiết người dùng.",
      },
    );

    return mapApiUserToUi(data);
  },

  async updateUserStatusById(
    userId: number,
    status: UserStatus,
    reason: string,
  ): Promise<User> {
    const data = await apiClient.request<ApiUserResponse>(
      `/api/admin/users/${userId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể cập nhật trạng thái người dùng.",
        body: JSON.stringify({
          status: status === "Locked" ? "blocked" : "active",
          reason,
        }),
      },
    );

    return mapApiUserToUi(data);
  },

  async getAssignableRoles(): Promise<AssignableUserRole[]> {
    const roles = await roleManagementService.fetchRoles();

    return roles
      .filter((role) => role.status === "Active")
      .map((role) => mapBusinessRoleCodeToUiRole(role.code));
  },

  async assignUserRoleById(
    userId: number,
    nextRole: AssignableUserRole,
  ): Promise<User> {
    const businessRoleCode = mapUiRoleToBusinessRoleCode(nextRole);
    const roles = await roleManagementService.fetchRoles();
    const matchedRole = roles.find((role) => role.code === businessRoleCode);

    if (!matchedRole) {
      throw new Error(`Vai trò ${nextRole} hiện không khả dụng để gán.`);
    }

    const data = await apiClient.request<ApiUserResponse>(
      `/api/admin/users/${userId}/business-role`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage:
          "Không thể cập nhật vai trò nghiệp vụ cho người dùng.",
        body: JSON.stringify({
          businessRoleId: matchedRole.id,
        }),
      },
    );

    return mapApiUserToUi(data);
  },

  getSummaryCards(users: User[]): UserSummaryCard[] {
    const activeCount = users.filter((user) => user.status === "Active").length;
    const lockedCount = users.filter((user) => user.status === "Locked").length;
    const roleAssignedCount = users.filter((user) =>
      Boolean(user.businessRoleId),
    ).length;

    return [
      {
        title: "Tổng tài khoản",
        value: String(users.length),
        subtitle: "Toàn bộ tài khoản marketplace",
      },
      {
        title: "Tài khoản hoạt động",
        value: String(activeCount),
        subtitle: "Hiện đang có thể truy cập",
      },
      {
        title: "Tài khoản bị khóa",
        value: String(lockedCount),
        subtitle: "Đang bị hạn chế bởi quản trị viên",
      },
      {
        title: "Đã gán vai trò",
        value: String(roleAssignedCount),
        subtitle: "Mỗi người dùng chỉ có một vai trò nghiệp vụ",
      },
    ];
  },

  getRoleCounts(users: User[]): UserRoleCountItem[] {
    const roles: UserRole[] = [
      "User",
      "Manager",
      "Host",
      "Collaborator",
      "Operation Staff",
    ];

    return roles.map((role) => ({
      role,
      count: users.filter((user) => user.role === role).length,
    }));
  },

  getRecentActivityLogs(users: User[]): FlattenedUserActivityItem[] {
    return users
      .flatMap((user) =>
        user.activityLogs.map((log) => ({
          ...log,
          userId: user.id,
          userName: user.fullName,
        })),
      )
      .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
  },
};
