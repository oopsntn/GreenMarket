import { pgTable, serial, varchar, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const placementSlots = pgTable("placement_slots", {
    placementSlotId: serial("placement_slot_id").primaryKey(),
    placementSlotCode: varchar("placement_slot_code", { length: 100 }),
    placementSlotTitle: varchar("placement_slot_title", { length: 150 }),
    placementSlotCapacity: integer("placement_slot_capacity"),
    placementSlotRules: jsonb("placement_slot_rules"),
    placementSlotPublished: boolean("placement_slot_published").default(false),
    placementSlotCreatedAt: timestamp("placement_slot_created_at").defaultNow(),
});

export type PlacementSlot = InferSelectModel<typeof placementSlots>;
export type NewPlacementSlot = InferInsertModel<typeof placementSlots>;
