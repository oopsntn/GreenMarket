import { initialUsers } from "../mock-data/users";
import type {
  FlattenedUserActivityItem,
  User,
  UserFormState,
  UserRole,
  UserRoleCountItem,
  UserStatus,
  UserSummaryCard,
} from "../types/user";

const DEFAULT_ADMIN_NAME = "System Administrator";
const DEFAULT_DATE = "2026-03-29";

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

export const userService = {
  getUsers(): User[] {
    return initialUsers;
  },

  createUser(users: User[], formData: UserFormState): User[] {
    const newUser: User = {
      id: getNextUserId(users),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      role: formData.role,
      status: "Active",
      joinedAt: DEFAULT_DATE,
      roleAssignments: [
        {
          id: 1,
          role: formData.role,
          assignedBy: DEFAULT_ADMIN_NAME,
          assignedAt: DEFAULT_DATE,
          note: "Initial role assignment during account creation.",
        },
      ],
      activityLogs: [
        {
          id: 1,
          action: "Account Created",
          detail: "User account was created in the admin panel.",
          performedBy: DEFAULT_ADMIN_NAME,
          performedAt: `${DEFAULT_DATE} 09:00`,
        },
        {
          id: 2,
          action: "Role Assigned",
          detail: `Assigned role: ${formData.role}.`,
          performedBy: DEFAULT_ADMIN_NAME,
          performedAt: `${DEFAULT_DATE} 09:01`,
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
              assignedAt: DEFAULT_DATE,
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
          performedAt: `${DEFAULT_DATE} 10:00`,
        },
        ...(didRoleChange
          ? [
              {
                id: getNextNestedId(user.activityLogs) + 1,
                action: "Role Changed",
                detail: `Changed role from ${user.role} to ${nextRole}.`,
                performedBy: DEFAULT_ADMIN_NAME,
                performedAt: `${DEFAULT_DATE} 10:01`,
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
            performedAt: `${DEFAULT_DATE} 11:00`,
          },
        ],
      };
    });
  },

  getSummaryCards(users: User[]): UserSummaryCard[] {
    const activeCount = users.filter((user) => user.status === "Active").length;
    const lockedCount = users.filter((user) => user.status === "Locked").length;
    const protectedCount = users.filter((user) => user.role === "Admin").length;

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
        title: "Protected Admins",
        value: String(protectedCount),
        subtitle: "Role and status protected",
      },
    ];
  },

  getRoleCounts(users: User[]): UserRoleCountItem[] {
    const roles: UserRole[] = [
      "Admin",
      "Customer",
      "Manager",
      "Host",
      "Collaborator",
      "Operations Staff",
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
      .sort((a, b) => b.performedAt.localeCompare(a.performedAt))
      .slice(0, 10);
  },
};
