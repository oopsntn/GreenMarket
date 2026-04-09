import { Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { eventLogs, users } from "../../models/schema/index.ts";

type EventLogMeta = {
  action?: string;
  detail?: string;
  performedBy?: string;
  generatedBy?: string;
  reportName?: string;
  status?: string;
};

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const titleCaseEventType = (value: string | null) => {
  if (!value) return "System Event";

  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export const getActivityLogs = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rows = await db
      .select({
        eventLogId: eventLogs.eventLogId,
        eventLogUserId: eventLogs.eventLogUserId,
        eventLogEventType: eventLogs.eventLogEventType,
        eventLogEventTime: eventLogs.eventLogEventTime,
        eventLogMeta: eventLogs.eventLogMeta,
        userDisplayName: users.userDisplayName,
        userEmail: users.userEmail,
      })
      .from(eventLogs)
      .leftJoin(users, eq(eventLogs.eventLogUserId, users.userId))
      .orderBy(desc(eventLogs.eventLogEventTime));

    res.json(
      rows.map((row) => {
        const meta = row.eventLogMeta as EventLogMeta | null;
        const action =
          meta?.action || titleCaseEventType(row.eventLogEventType);
        const performedBy =
          meta?.performedBy || meta?.generatedBy || "System Administrator";
        const userName =
          row.userDisplayName ||
          row.userEmail ||
          (row.eventLogUserId ? `User #${row.eventLogUserId}` : "System");

        return {
          id: row.eventLogId,
          userId: row.eventLogUserId ?? 0,
          userName,
          action,
          detail:
            meta?.detail ||
            meta?.reportName ||
            `${action} recorded by the backend event log.`,
          performedBy,
          performedAt: formatDateTime(row.eventLogEventTime),
        };
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
