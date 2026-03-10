import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    userId: serial("userId").primaryKey(),
    userMobile: varchar("userMobile", { length: 15 }),
    userDisplayName: varchar("userDisplayName", { length: 80 }),
    userAvatarUrl: varchar("userAvatarUrl", { length: 255 }),
    userStatus: varchar("userStatus", { length: 20 }),
    userRegisteredAt: timestamp("userRegisteredAt"),
    userLastLoginAt: timestamp("userLastLoginAt"),
    userCreatedAt: timestamp("userCreatedAt").defaultNow(),
    userUpdatedAt: timestamp("userUpdatedAt").defaultNow(),
});
