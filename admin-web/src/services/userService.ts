import { initialUsers } from "../mock-data/users";
import type { User, UserFormState } from "../types/user";

export const userService = {
  getUsers(): User[] {
    return initialUsers;
  },

  createUser(users: User[], formData: UserFormState): User[] {
    const newUser: User = {
      id: users.length + 1,
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      joinedAt: "2026-03-18",
    };

    return [newUser, ...users];
  },

  updateUser(
    users: User[],
    selectedUserId: number,
    formData: UserFormState,
  ): User[] {
    return users.map((user) =>
      user.id === selectedUserId
        ? {
            ...user,
            fullName: formData.fullName,
            email: formData.email,
            role: formData.role,
            status: formData.status,
          }
        : user,
    );
  },
};
