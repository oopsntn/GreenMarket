import { pgTable, serial, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const attributes = pgTable("attributes", {
    attributeId: serial("attribute_id").primaryKey(),
    attributeCode: varchar("attribute_code", { length: 100 }),
    attributeTitle: varchar("attribute_title", { length: 150 }),
    attributeDataType: varchar("attribute_data_type", { length: 50 }),
    attributeOptions: jsonb("attribute_options"),
    attributePublished: boolean("attribute_published").default(false),
    attributeCreatedAt: timestamp("attribute_created_at").defaultNow(),
});

export type Attribute = InferSelectModel<typeof attributes>;
export type NewAttribute = InferInsertModel<typeof attributes>;
