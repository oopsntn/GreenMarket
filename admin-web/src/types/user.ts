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

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
};

export type UserFormState = {
  fullName: string;
  email: string;
  role: AssignableUserRole;
  status: UserStatus;
};
