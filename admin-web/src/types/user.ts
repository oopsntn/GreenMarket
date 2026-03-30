export type UserStatus = "Active" | "Locked";

export type UserRole =
  | "Customer"
  | "Manager"
  | "Host"
  | "Collaborator"
  | "Operations Staff"
  | "Admin";

export type AssignableUserRole =
  | "Customer"
  | "Manager"
  | "Host"
  | "Collaborator"
  | "Operations Staff";

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
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  roleAssignments: RoleAssignmentHistoryItem[];
  activityLogs: UserActivityLogItem[];
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
