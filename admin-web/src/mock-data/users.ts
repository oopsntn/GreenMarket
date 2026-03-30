import type { User, UserFormState } from "../types/user";

export const initialUsers: User[] = [
  {
    id: 1,
    fullName: "System Administrator",
    email: "admin@greenmarket.vn",
    role: "Admin",
    status: "Active",
    joinedAt: "2026-03-01",
    roleAssignments: [
      {
        id: 1,
        role: "Admin",
        assignedBy: "System Setup",
        assignedAt: "2026-03-01",
        note: "Initial protected administrator account.",
      },
    ],
    activityLogs: [
      {
        id: 1,
        action: "Account Created",
        detail: "Protected administrator account was created.",
        performedBy: "System Setup",
        performedAt: "2026-03-01 08:00",
      },
      {
        id: 2,
        action: "Role Assigned",
        detail: "Assigned role: Admin.",
        performedBy: "System Setup",
        performedAt: "2026-03-01 08:01",
      },
    ],
  },
  {
    id: 2,
    fullName: "Nguyen Van A",
    email: "vana@greenmarket.vn",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-03-10",
    roleAssignments: [
      {
        id: 1,
        role: "Customer",
        assignedBy: "System Administrator",
        assignedAt: "2026-03-10",
        note: "Initial account setup.",
      },
    ],
    activityLogs: [
      {
        id: 1,
        action: "Account Created",
        detail: "User account was created in the admin panel.",
        performedBy: "System Administrator",
        performedAt: "2026-03-10 09:00",
      },
      {
        id: 2,
        action: "Role Assigned",
        detail: "Assigned role: Customer.",
        performedBy: "System Administrator",
        performedAt: "2026-03-10 09:01",
      },
    ],
  },
  {
    id: 3,
    fullName: "Tran Thi B",
    email: "thib@greenmarket.vn",
    role: "Manager",
    status: "Active",
    joinedAt: "2026-03-11",
    roleAssignments: [
      {
        id: 1,
        role: "Manager",
        assignedBy: "System Administrator",
        assignedAt: "2026-03-11",
        note: "Assigned moderation responsibilities.",
      },
    ],
    activityLogs: [
      {
        id: 1,
        action: "Account Created",
        detail: "User account was created in the admin panel.",
        performedBy: "System Administrator",
        performedAt: "2026-03-11 10:00",
      },
      {
        id: 2,
        action: "Role Assigned",
        detail: "Assigned role: Manager.",
        performedBy: "System Administrator",
        performedAt: "2026-03-11 10:02",
      },
    ],
  },
  {
    id: 4,
    fullName: "Le Van C",
    email: "vanc@greenmarket.vn",
    role: "Host",
    status: "Locked",
    joinedAt: "2026-03-12",
    roleAssignments: [
      {
        id: 1,
        role: "Host",
        assignedBy: "System Administrator",
        assignedAt: "2026-03-12",
        note: "Initial account setup.",
      },
    ],
    activityLogs: [
      {
        id: 1,
        action: "Account Created",
        detail: "User account was created in the admin panel.",
        performedBy: "System Administrator",
        performedAt: "2026-03-12 11:00",
      },
      {
        id: 2,
        action: "Role Assigned",
        detail: "Assigned role: Host.",
        performedBy: "System Administrator",
        performedAt: "2026-03-12 11:01",
      },
      {
        id: 3,
        action: "Account Locked",
        detail: "Account access was restricted by admin review.",
        performedBy: "System Administrator",
        performedAt: "2026-03-18 15:30",
      },
    ],
  },
  {
    id: 5,
    fullName: "Pham Thi D",
    email: "thid@greenmarket.vn",
    role: "Collaborator",
    status: "Active",
    joinedAt: "2026-03-13",
    roleAssignments: [
      {
        id: 1,
        role: "Collaborator",
        assignedBy: "System Administrator",
        assignedAt: "2026-03-13",
        note: "Initial account setup.",
      },
    ],
    activityLogs: [
      {
        id: 1,
        action: "Account Created",
        detail: "User account was created in the admin panel.",
        performedBy: "System Administrator",
        performedAt: "2026-03-13 13:00",
      },
      {
        id: 2,
        action: "Role Assigned",
        detail: "Assigned role: Collaborator.",
        performedBy: "System Administrator",
        performedAt: "2026-03-13 13:01",
      },
    ],
  },
  {
    id: 6,
    fullName: "Hoang Van E",
    email: "vane@greenmarket.vn",
    role: "Operations Staff",
    status: "Active",
    joinedAt: "2026-03-14",
    roleAssignments: [
      {
        id: 1,
        role: "Operations Staff",
        assignedBy: "System Administrator",
        assignedAt: "2026-03-14",
        note: "Assigned operations support responsibilities.",
      },
    ],
    activityLogs: [
      {
        id: 1,
        action: "Account Created",
        detail: "User account was created in the admin panel.",
        performedBy: "System Administrator",
        performedAt: "2026-03-14 14:00",
      },
      {
        id: 2,
        action: "Role Assigned",
        detail: "Assigned role: Operations Staff.",
        performedBy: "System Administrator",
        performedAt: "2026-03-14 14:02",
      },
    ],
  },
];

export const emptyUserForm: UserFormState = {
  fullName: "",
  email: "",
  role: "Customer",
};
