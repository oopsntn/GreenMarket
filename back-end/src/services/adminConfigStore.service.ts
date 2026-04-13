import { eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import { systemSettings } from "../models/schema/index.ts";

const parseJsonValue = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const adminConfigStoreService = {
  async getJson<T>(key: string, fallback: T): Promise<T> {
    const [setting] = await db
      .select({
        value: systemSettings.systemSettingValue,
      })
      .from(systemSettings)
      .where(eq(systemSettings.systemSettingKey, key))
      .limit(1);

    return parseJsonValue<T>(setting?.value, fallback);
  },

  async setJson<T>(
    key: string,
    value: T,
    updatedBy?: number | null,
  ): Promise<T> {
    await db
      .insert(systemSettings)
      .values({
        systemSettingKey: key,
        systemSettingValue: JSON.stringify(value),
        systemSettingUpdatedBy: updatedBy ?? null,
        systemSettingUpdatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.systemSettingKey,
        set: {
          systemSettingValue: JSON.stringify(value),
          systemSettingUpdatedBy: updatedBy ?? null,
          systemSettingUpdatedAt: new Date(),
        },
      });

    return value;
  },
};
