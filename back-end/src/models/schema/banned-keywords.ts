import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const bannedKeywords = pgTable("banned_keywords", {
    bannedKeywordId: serial("banned_keyword_id").primaryKey(),
    bannedKeywordKeyword: varchar("banned_keyword_keyword", { length: 50 }),
    bannedKeywordPublished: boolean("banned_keyword_published").default(false),
    bannedKeywordCreatedAt: timestamp("banned_keyword_created_at").defaultNow(),
});

export type BannedKeyword = InferSelectModel<typeof bannedKeywords>;
export type NewBannedKeyword = InferInsertModel<typeof bannedKeywords>;
