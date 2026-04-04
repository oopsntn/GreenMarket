import { apiClient } from "../lib/apiClient";
import { initialUsers } from "../mock-data/users";
import { roleManagementService } from "./roleManagementService";
import { readStoredJson, writeStoredJson } from "../utils/browserStorage";
import type {
  ApiUserResponse,
  AssignableUserRole,
  FlattenedUserActivityItem,
  User,
  UserFormState,
  UserRole,
  UserRoleCountItem,
  UserStatus,
  UserSummaryCard,
} from "../types/user";

const DEFAULT_ADMIN_NAME = "System Administrator";
const USER_ROLE_STORAGE_KEY = "adminUserRoleAssignments";

type StoredUserRoleAssignment = {
  userId: number;
  role: AssignableUserRole;
  roleAssignments: User["roleAssignments"];
};

const padNumber = (value: number) => String(value).padStart(2, "0");

const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = padNumber(now.getMonth() + 1);
  const day = padNumber(now.getDate());

  return `${year}-${month}-${day}`;
};

const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = padNumber(now.getMonth() + 1);
  const day = padNumber(now.getDate());
  const hours = padNumber(now.getHours());
  const minutes = padNumber(now.getMinutes());

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const getNextUserId = (users: User[]) => {
  if (users.length === 0) return 1;
  return Math.max(...users.map((user) => user.id)) + 1;
};

const getNextNestedId = (
  items: Array<{
    id: number;
  }>,
) => {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
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

  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const mapApiStatusToUiStatus = (value: string | null): UserStatus => {
  return value?.toLowerCase() === "blocked" ? "Locked" : "Active";
};

const getStoredUserRoles = () =>
  readStoredJson<StoredUserRoleAssignment[]>(USER_ROLE_STORAGE_KEY, []);

const saveStoredUserRoles = (assignments: StoredUserRoleAssignment[]) => {
  writeStoredJson(USER_ROLE_STORAGE_KEY, assignments);
  return assignments;
};

const defaultRoleAssignments: Record<number, AssignableUserRole> = {
  1: "Host",
  2: "Collaborator",
  3: "Host",
  4: "Host",
  5: "User",
};

const getDefaultRole = (userId: number): AssignableUserRole =>
  defaultRoleAssignments[userId] ?? "User";

const buildDefaultRoleHistory = (
  role: AssignableUserRole,
  registeredAt: string,
): User["roleAssignments"] => [
  {
    id: 1,
    role,
    assignedBy: DEFAULT_ADMIN_NAME,
    assignedAt: registeredAt || getCurrentDate(),
    note: `Initial ${role} role alignment based on the current system catalog.`,
  },
];

const getStoredRoleState = (
  userId: number,
  registeredAt: string,
): { role: UserRole; history: User["roleAssignments"] } => {
  const existing = getStoredUserRoles().find((item) => item.userId === userId);

  if (existing) {
    return {
      role: existing.role,
      history: existing.roleAssignments,
    };
  }

  const defaultRole = getDefaultRole(userId);
  return {
    role: defaultRole,
    history: buildDefaultRoleHistory(defaultRole, registeredAt),
  };
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

  const joinedAt = formatDate(item.userRegisteredAt || item.userCreatedAt);
  const roleState = getStoredRoleState(item.userId, joinedAt);

  return {
    id: item.userId,
    fullName,
    phone: item.userMobile?.trim() || "N/A",
    email: item.userEmail?.trim() || "No email",
    role: roleState.role,
    status: mapApiStatusToUiStatus(item.userStatus),
    joinedAt,
    location: item.userLocation?.trim() || "No location",
    lastLoginAt: formatDateTime(item.userLastLoginAt) || "No login yet",
    roleAssignments: roleState.history,
    activityLogs: buildDerivedActivityLogs(item, fullName),
  };
};

export const userService = {
  async fetchUsers(): Promise<User[]> {
    const data = await apiClient.request<ApiUserResponse[]>("/api/admin/users", {
      defaultErrorMessage: "Unable to load users.",
    });

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

  getAssignableRoles(): AssignableUserRole[] {
    return roleManagementService.getRoles().map(
      (role) => role.title as AssignableUserRole,
    );
  },

  assignUserRole(user: User, nextRole: AssignableUserRole): User {
    const timestamp = getCurrentDate();
    const activityTimestamp = getCurrentDateTime();

    const nextRoleAssignments = [
      ...user.roleAssignments,
      {
        id: getNextNestedId(user.roleAssignments),
        role: nextRole,
        assignedBy: DEFAULT_ADMIN_NAME,
        assignedAt: timestamp,
        note: `Role changed from ${user.role} to ${nextRole}.`,
      },
    ];

    const storedAssignments = getStoredUserRoles();
    const nextStoredAssignments = storedAssignments.some(
      (item) => item.userId === user.id,
    )
      ? storedAssignments.map((item) =>
          item.userId === user.id
            ? {
                ...item,
                role: nextRole,
                roleAssignments: nextRoleAssignments,
              }
            : item,
        )
      : [
          ...storedAssignments,
          {
            userId: user.id,
            role: nextRole,
            roleAssignments: nextRoleAssignments,
          },
        ];

    saveStoredUserRoles(nextStoredAssignments);

    return {
      ...user,
      role: nextRole,
      roleAssignments: nextRoleAssignments,
      activityLogs: [
        {
          id: getNextNestedId(user.activityLogs),
          action: "Role Assigned",
          detail: `Assigned marketplace role: ${nextRole}.`,
          performedBy: DEFAULT_ADMIN_NAME,
          performedAt: activityTimestamp,
        },
        ...user.activityLogs,
      ],
    };
  },

  getUsers(): User[] {
    return initialUsers;
  },

  createUser(users: User[], formData: UserFormState): User[] {
    const currentDate = getCurrentDate();
    const currentDateTime = getCurrentDateTime();

    const newUser: User = {
      id: getNextUserId(users),
      fullName: formData.fullName.trim(),
      phone: "Pending",
      email: formData.email.trim(),
      role: formData.role,
      status: "Active",
      joinedAt: currentDate,
      location: "Not set",
      lastLoginAt: "No login yet",
      roleAssignments: [
        {
          id: 1,
          role: formData.role,
          assignedBy: DEFAULT_ADMIN_NAME,
          assignedAt: currentDate,
          note: "Initial role assignment during account creation.",
        },
      ],
      activityLogs: [
        {
          id: 1,
          action: "Account Created",
          detail: "User account was created in the admin panel.",
          performedBy: DEFAULT_ADMIN_NAME,
          performedAt: currentDateTime,
        },
        {
          id: 2,
          action: "Role Assigned",
          detail: `Assigned role: ${formData.role}.`,
          performedBy: DEFAULT_ADMIN_NAME,
          performedAt: currentDateTime,
        },
      ],
    };

    return [newUser, ...users];
  },

  updateUser(
    users: User[],
    selectedUserId: number,
    formData: UserFormState,
  ): User[] {
    const currentDate = getCurrentDate();
    const currentDateTime = getCurrentDateTime();

    return users.map((user) => {
      if (user.id !== selectedUserId) return user;

      const nextRole = formData.role;
      const didRoleChange = user.role !== nextRole;

      const updatedRoleAssignments = didRoleChange
        ? [
            ...user.roleAssignments,
            {
              id: getNextNestedId(user.roleAssignments),
              role: nextRole,
              assignedBy: DEFAULT_ADMIN_NAME,
              assignedAt: currentDate,
              note: `Role changed from ${user.role} to ${nextRole}.`,
            },
          ]
        : user.roleAssignments;

      const updatedActivityLogs = [
        ...user.activityLogs,
        {
          id: getNextNestedId(user.activityLogs),
          action: "Profile Updated",
          detail: "User profile information was updated.",
          performedBy: DEFAULT_ADMIN_NAME,
          performedAt: currentDateTime,
        },
        ...(didRoleChange
          ? [
              {
                id: getNextNestedId(user.activityLogs) + 1,
                action: "Role Changed",
                detail: `Changed role from ${user.role} to ${nextRole}.`,
                performedBy: DEFAULT_ADMIN_NAME,
                performedAt: currentDateTime,
              },
            ]
          : []),
      ];

      return {
        ...user,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        role: nextRole,
        roleAssignments: updatedRoleAssignments,
        activityLogs: updatedActivityLogs,
      };
    });
  },

  updateUserStatus(users: User[], userId: number, status: UserStatus): User[] {
    const currentDateTime = getCurrentDateTime();

    return users.map((user) => {
      if (user.id !== userId) return user;

      const nextLogId = getNextNestedId(user.activityLogs);
      const action =
        status === "Locked" ? "Account Locked" : "Account Unlocked";
      const detail =
        status === "Locked"
          ? "Account access was restricted by admin action."
          : "Account access was restored by admin action.";

      return {
        ...user,
        status,
        activityLogs: [
          ...user.activityLogs,
          {
            id: nextLogId,
            action,
            detail,
            performedBy: DEFAULT_ADMIN_NAME,
            performedAt: currentDateTime,
          },
        ],
      };
    });
  },

  getSummaryCards(users: User[]): UserSummaryCard[] {
    const activeCount = users.filter((user) => user.status === "Active").length;
    const lockedCount = users.filter((user) => user.status === "Locked").length;
    const roleAssignedCount = users.filter((user) => Boolean(user.role)).length;

    return [
      {
        title: "Total Accounts",
        value: String(users.length),
        subtitle: "All internal accounts",
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
        subtitle: "Marketplace roles maintained from the user directory",
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
