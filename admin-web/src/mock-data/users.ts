import type { User, UserFormState } from "../types/user";

export const initialUsers: User[] = [
  {
    id: 1,
    fullName: "System Administrator",
    email: "admin@greenmarket.vn",
    role: "Admin",
    status: "Active",
    joinedAt: "2026-03-01",
  },
  {
    id: 2,
    fullName: "Nguyen Van A",
    email: "vana@greenmarket.vn",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-03-10",
  },
  {
    id: 3,
    fullName: "Tran Thi B",
    email: "thib@greenmarket.vn",
    role: "Manager",
    status: "Active",
    joinedAt: "2026-03-11",
  },
  {
    id: 4,
    fullName: "Le Van C",
    email: "vanc@greenmarket.vn",
    role: "Host",
    status: "Locked",
    joinedAt: "2026-03-12",
  },
  {
    id: 5,
    fullName: "Pham Thi D",
    email: "thid@greenmarket.vn",
    role: "Collaborator",
    status: "Active",
    joinedAt: "2026-03-13",
  },
  {
    id: 6,
    fullName: "Hoang Van E",
    email: "vane@greenmarket.vn",
    role: "Operations Staff",
    status: "Active",
    joinedAt: "2026-03-14",
  },
];

export const emptyUserForm: UserFormState = {
  fullName: "",
  email: "",
  role: "Customer",
  status: "Active",
};
