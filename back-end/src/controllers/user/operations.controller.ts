import { Response } from "express";
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  operationTasks,
  taskReplies,
  escalations,
  notifications,
  users,
  reports,
  posts,
  shops,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_TASK_STATUSES = ["open", "in_progress", "closed"] as const;
const VALID_TASK_TYPES = ["report", "verification", "support"] as const;
const VALID_PRIORITY_LEVELS = ["low", "medium", "high", "critical"] as const;
const VALID_REPLY_VISIBILITIES = ["internal", "public"] as const;

type TaskStatus = (typeof VALID_TASK_STATUSES)[number];
type TaskType = (typeof VALID_TASK_TYPES)[number];
type PriorityLevel = (typeof VALID_PRIORITY_LEVELS)[number];
type ReplyVisibility = (typeof VALID_REPLY_VISIBILITIES)[number];

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
};

const parsePagination = (queryPage: unknown, queryLimit: unknown) => {
  const page = toPositiveInt(queryPage, DEFAULT_PAGE);
  const limit = Math.min(toPositiveInt(queryLimit, DEFAULT_LIMIT), MAX_LIMIT);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const getStringParam = (value: unknown) => {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
};

const normalizeOptionalEnum = <T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | undefined | null => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (!allowed.includes(normalized as T[number])) return null;
  return normalized as T[number];
};

export const getOperationTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const statusFilter = normalizeOptionalEnum(req.query.status, VALID_TASK_STATUSES);
    const typeFilter = normalizeOptionalEnum(req.query.type, VALID_TASK_TYPES);
    const priorityFilter = normalizeOptionalEnum(req.query.priority, VALID_PRIORITY_LEVELS);

    const whereClauses: SQL[] = [eq(operationTasks.assigneeId, userId)];
    if (statusFilter) whereClauses.push(eq(operationTasks.taskStatus, statusFilter));
    if (typeFilter) whereClauses.push(eq(operationTasks.taskType, typeFilter));
    if (priorityFilter) whereClauses.push(eq(operationTasks.taskPriority, priorityFilter));

    const [tasks, [{ count }]] = await Promise.all([
      db
        .select({
          taskId: operationTasks.taskId,
          title: operationTasks.taskTitle,
          type: operationTasks.taskType,
          status: operationTasks.taskStatus,
          priority: operationTasks.taskPriority,
          createdAt: operationTasks.createdAt,
          updatedAt: operationTasks.updatedAt,
          customerName: users.userDisplayName,
        })
        .from(operationTasks)
        .leftJoin(users, eq(operationTasks.customerId, users.userId))
        .where(and(...whereClauses))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(operationTasks.updatedAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(operationTasks)
        .where(and(...whereClauses)),
    ]);

    res.json({
      data: tasks,
      meta: {
        page,
        limit,
        totalItems: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOperationTaskDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const taskId = parseId(getStringParam(req.params.id));
    if (!userId || !taskId) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const [task] = await db
      .select()
      .from(operationTasks)
      .where(and(eq(operationTasks.taskId, taskId), eq(operationTasks.assigneeId, userId)))
      .limit(1);

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const [replies, taskEscalations] = await Promise.all([
      db
        .select({
          replyId: taskReplies.replyId,
          message: taskReplies.message,
          attachments: taskReplies.attachments,
          visibility: taskReplies.visibility,
          createdAt: taskReplies.createdAt,
          senderName: users.userDisplayName,
        })
        .from(taskReplies)
        .leftJoin(users, eq(taskReplies.senderId, users.userId))
        .where(eq(taskReplies.taskId, taskId))
        .orderBy(desc(taskReplies.createdAt)),
      db
        .select()
        .from(escalations)
        .where(eq(escalations.sourceTaskId, taskId))
        .orderBy(desc(escalations.createdAt)),
    ]);

    res.json({
      task,
      replies,
      escalations: taskEscalations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateOperationTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const taskId = parseId(getStringParam(req.params.id));
    const nextStatus = normalizeOptionalEnum(req.body?.status, VALID_TASK_STATUSES);

    if (!userId || !taskId || !nextStatus) {
      res.status(400).json({ error: "Invalid request data" });
      return;
    }

    const [existingTask] = await db
      .select()
      .from(operationTasks)
      .where(and(eq(operationTasks.taskId, taskId), eq(operationTasks.assigneeId, userId)))
      .limit(1);

    if (!existingTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const currentStatus = existingTask.taskStatus;

    if (currentStatus === "closed" && nextStatus !== "closed") {
      res.status(409).json({ error: "Cannot reopen a closed task" });
      return;
    }

    if (currentStatus === "open" && nextStatus === "closed") {

      res.status(409).json({ error: "Task must be in_progress before closing" });
      return;
    }

    const [updatedTask] = await db
      .update(operationTasks)
      .set({
        taskStatus: nextStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(operationTasks.taskId, taskId), eq(operationTasks.assigneeId, userId)))
      .returning();

    res.json({ task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createOperationTaskReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const taskId = parseId(getStringParam(req.params.id));
    const { message, attachments, visibility } = req.body;

    if (!userId || !taskId || !message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const [newReply] = await db
      .insert(taskReplies)
      .values({
        taskId,
        senderId: userId,
        message,
        attachments: attachments || [],
        visibility: visibility || "internal",
      })
      .returning();

    res.status(201).json({
      message: "Reply added successfully",
      reply: newReply,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const escalateOperationTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const taskId = parseId(getStringParam(req.params.id));
    const { reason, severity, targetType, targetId, priority, targetRole } = req.body;

    const finalReason = reason || "No reason provided";
    const finalSeverity = severity || priority || "medium";
    const finalTargetType = targetType || targetRole || "MANAGER";
    const finalTargetId = targetId || taskId || 0;

    if (!userId || !taskId) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const [task] = await db
      .select({ status: operationTasks.taskStatus })
      .from(operationTasks)
      .where(eq(operationTasks.taskId, taskId))
      .limit(1);

    if (task?.status === "closed") {
      res.status(409).json({ error: "Cannot escalate a closed task" });
      return;
    }

    const [escalation] = await db.insert(escalations).values({
      sourceTaskId: taskId,
      targetType: finalTargetType,
      targetId: finalTargetId,
      createdBy: userId,
      reason: finalReason,
      severity: finalSeverity,
      status: "open",
    }).returning();

    res.status(201).json({ escalation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getDailyOperationWorkload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        closed: sql<number>`count(*) filter (where task_status = 'closed')::int`,
        open: sql<number>`count(*) filter (where task_status = 'open')::int`,
        inProgress: sql<number>`count(*) filter (where task_status = 'in_progress')::int`,
      })
      .from(operationTasks)
      .where(and(eq(operationTasks.assigneeId, userId), gte(operationTasks.createdAt, today)));

    res.json({ stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOperationNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const staffNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    res.json({ data: staffNotifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
