export interface UserDTO {
    userId: number;
    userMobile?: string | null;
    userDisplayName?: string | null;
    userAvatarUrl?: string | null;
    userStatus?: string | null;
    userRegisteredAt?: Date | null;
    userLastLoginAt?: Date | null;
    userCreatedAt: Date;
    userUpdatedAt: Date;
}

export type CreateUserDTO = Omit<UserDTO, "userId" | "userCreatedAt" | "userUpdatedAt">;
export type UpdateUserDTO = Partial<CreateUserDTO>;
