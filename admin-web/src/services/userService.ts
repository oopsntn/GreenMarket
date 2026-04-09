import { apiClient } from "../lib/apiClient";
import { roleManagementService } from "./roleManagementService";
import type {
  ApiUserResponse,
  AssignableUserRole,
  FlattenedUserActivityItem,
  User,
  UserRole,
  UserRoleCountItem,
  UserStatus,
  UserSummaryCard,
} from "../types/user";

const DEFAULT_ADMIN_NAME = "System Administrator";

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

const buildRoleAssignmentHistory = (
  user: ApiUserResponse,
  role: AssignableUserRole,
): User["roleAssignments"] => {
  const assignedAt =
    formatDate(user.userUpdatedAt || user.userCreatedAt) || getCurrentDate();

  return [
    {
      id: 1,
      role,
      assignedBy: DEFAULT_ADMIN_NAME,
      assignedAt,
      note: user.businessRoleTitle
        ? `Current marketplace role is ${user.businessRoleTitle}.`
        : "No marketplace role assigned yet.",
    },
  ];
};

const buildDerivedActivityLogs = (
  user: ApiUserResponse,
  displayName: string,
): User["activityLogs"] => {
  const registrationDateTime = formatDateTime(
    user.userRegisteredAt || user.userCreatedAt,
  );
  const lastLoginDateTime = formatDateTime(user.userLastLoginAt);
  const updatedDateTime = formatDateTime(user.userUpdatedAt);

  const logs: User["activityLogs"] = [];

  if (registrationDateTime) {
    logs.push({
      id: 1,
      action: "Account Registered",
      detail: "User account was registered in the marketplace.",
      performedBy: "System",
      performedAt: registrationDateTime,
    });
  }

  if (lastLoginDateTime) {
    logs.push({
      id: logs.length + 1,
      action: "Last Login Recorded",
      detail: "Latest successful user sign-in captured by the system.",
      performedBy: displayName,
      performedAt: lastLoginDateTime,
    });
  }

  if (user.businessRoleTitle && updatedDateTime) {
    logs.push({
      id: logs.length + 1,
      action: "Role Assigned",
      detail: `Assigned marketplace role: ${user.businessRoleTitle}.`,
      performedBy: DEFAULT_ADMIN_NAME,
      performedAt: updatedDateTime,
    });
  }

  if (
    updatedDateTime &&
    updatedDateTime !== registrationDateTime &&
    updatedDateTime !== lastLoginDateTime
  ) {
    logs.push({
      id: logs.length + 1,
      action:
        mapApiStatusToUiStatus(user.userStatus) === "Locked"
          ? "Account Locked"
          : "Profile Updated",
      detail:
        mapApiStatusToUiStatus(user.userStatus) === "Locked"
          ? "Account access is currently blocked by admin action."
          : "User profile information was updated.",
      performedBy:
        mapApiStatusToUiStatus(user.userStatus) === "Locked"
          ? DEFAULT_ADMIN_NAME
          : "System Sync",
      performedAt: updatedDateTime,
    });
  }

  return logs.sort((a, b) => b.performedAt.localeCompare(a.performedAt));
};

const mapApiUserToUi = (item: ApiUserResponse): User => {
  const fullName =
    item.userDisplayName?.trim() ||
    item.userEmail?.trim() ||
    item.userMobile?.trim() ||
    `User #${item.userId}`;

  const role = mapBusinessRoleCodeToUiRole(item.businessRoleCode);

  return {
    id: item.userId,
    fullName,
    phone: item.userMobile?.trim() || "N/A",
    email: item.userEmail?.trim() || "No email",
    role,
    status: mapApiStatusToUiStatus(item.userStatus),
    joinedAt: formatDate(item.userRegisteredAt || item.userCreatedAt),
    location: item.userLocation?.trim() || "No location",
    lastLoginAt: formatDateTime(item.userLastLoginAt) || "No login yet",
    roleAssignments: buildRoleAssignmentHistory(item, role),
    activityLogs: buildDerivedActivityLogs(item, fullName),
    businessRoleId: item.businessRoleId ?? item.userBusinessRoleId ?? null,
    businessRoleCode: item.businessRoleCode ?? null,
    businessRoleTitle: item.businessRoleTitle ?? null,
  };
};

export const userService = {
  async fetchUsers(): Promise<User[]> {
    const data = await apiClient.request<ApiUserResponse[]>(
      "/api/admin/users",
      {
        defaultErrorMessage: "Unable to load users.",
      },
    );

    return data.map(mapApiUserToUi);
  },

  async fetchUserById(userId: number): Promise<User> {
    const data = await apiClient.request<ApiUserResponse>(
      `/api/admin/users/${userId}`,
      {
        defaultErrorMessage: "Unable to load user details.",
      },
    );

    return mapApiUserToUi(data);
  },

  async updateUserStatusById(
    userId: number,
    status: UserStatus,
  ): Promise<User> {
    const data = await apiClient.request<ApiUserResponse>(
      `/api/admin/users/${userId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update user status.",
        body: JSON.stringify({
          status: status === "Locked" ? "blocked" : "active",
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
      throw new Error(`Marketplace role ${nextRole} is not available.`);
    }

    const data = await apiClient.request<ApiUserResponse>(
      `/api/admin/users/${userId}/business-role`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to assign marketplace role.",
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
        title: "Total Accounts",
        value: String(users.length),
        subtitle: "All marketplace accounts",
      },
      {
        title: "Active Accounts",
        value: String(activeCount),
        subtitle: "Currently able to access",
      },
      {
        title: "Locked Accounts",
        value: String(lockedCount),
        subtitle: "Restricted by admin action",
      },
      {
        title: "Assigned Roles",
        value: String(roleAssignedCount),
        subtitle: "Marketplace roles linked from backend",
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
