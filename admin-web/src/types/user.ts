export type UserStatus = "Active" | "Locked";

export type UserRole =
  | "User"
  | "Manager"
  | "Host"
  | "Collaborator"
  | "Operation Staff";

export type AssignableUserRole =
  | "User"
  | "Manager"
  | "Host"
  | "Collaborator"
  | "Operation Staff";

export type RoleAssignmentHistoryItem = {
  id: number;
  role: UserRole;
  assignedBy: string;
  assignedAt: string;
  note: string;
};

export type UserActivityLogItem = {
  id: number;
  action: string;
  detail: string;
  performedBy: string;
  performedAt: string;
};

export type User = {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  location: string;
  lastLoginAt: string;
  roleAssignments: RoleAssignmentHistoryItem[];
  activityLogs: UserActivityLogItem[];
};

export type ApiUserResponse = {
  userId: number;
  userMobile: string;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  userEmail: string | null;
  userLocation: string | null;
  userBio: string | null;
  userStatus: string | null;
  userRegisteredAt: string | null;
  userLastLoginAt: string | null;
  userCreatedAt: string | null;
  userUpdatedAt: string | null;
};

export type UserFormState = {
  fullName: string;
  email: string;
  role: AssignableUserRole;
};

export type UserSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};

export type UserRoleCountItem = {
  role: UserRole;
  count: number;
};

export type FlattenedUserActivityItem = UserActivityLogItem & {
  userId: number;
  userName: string;
};
