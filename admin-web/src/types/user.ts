export type UserStatus = "Active" | "Locked";

export type UserRole =
  | "User"
  | "Manager"
  | "Host"
  | "Collaborator"
  | "Operation Staff";

export type AssignableUserRole = UserRole;

export type RoleAssignmentHistoryItem = {
  id: number;
  previousRole: UserRole | null;
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
  reason?: string | null;
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
  businessRoleId: number | null;
  businessRoleCode: string | null;
  businessRoleTitle: string | null;
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
  userBusinessRoleId: number | null;
  userRegisteredAt: string | null;
  userLastLoginAt: string | null;
  userCreatedAt: string | null;
  userUpdatedAt: string | null;
  businessRoleId: number | null;
  businessRoleCode: string | null;
  businessRoleTitle: string | null;
  businessRoleAudienceGroup: string | null;
  businessRoleAccessScope: string | null;
  businessRoleStatus: string | null;
  roleHistory?: Array<{
    id: number;
    previousRole: string | null;
    nextRole: string | null;
    assignedBy: string;
    assignedAt: string;
    note: string;
  }>;
  activityHistory?: Array<{
    id: number;
    action: string;
    detail: string;
    performedBy: string;
    performedAt: string;
    reason?: string | null;
  }>;
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
