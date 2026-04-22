import { Response } from "express";
import {
  and,
  desc,
  eq,
  sql,
} from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth";
import {
  transactions,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId";
import { notificationService } from "../../services/notification.service";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const parsePagination = (queryPage: unknown, queryLimit: unknown) => {
  const page = Number(queryPage) || DEFAULT_PAGE;
  const limit = Number(queryLimit) || DEFAULT_LIMIT;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Get all payout requests across the system
 */
export const getAllPayoutRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const status = req.query.status as string;

    const conditions = [
        eq(transactions.transactionType, "payout")
    ];
    if (status) {
      conditions.push(eq(transactions.transactionStatus, status));
    }

    const rows = await db
      .select({
        payoutRequestId: transactions.transactionId,
        userId: transactions.transactionUserId,
        userName: users.userDisplayName,
        userEmail: users.userEmail,
        userRole: users.userBusinessRoleId, // 3 for CTV, 2 for HOST (usually)
        amount: transactions.transactionAmount,
        method: transactions.transactionProvider,
        status: transactions.transactionStatus,
        note: sql<string>`${transactions.transactionMeta}->>'note'`,
        createdAt: transactions.transactionCreatedAt,
        processedAt: transactions.transactionUpdatedAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.transactionUserId, users.userId))
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions));

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Process a payout request (Approve/Reject)
 */
export const processPayoutRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestId = parseId(req.params.id as string);
    const { status, adminNote } = req.body; // 'success' or 'failed' (mapped from 'completed' or 'rejected')

    // Map legacy status to new transaction status
    const targetStatus = status === "completed" ? "success" : status === "rejected" ? "failed" : status;

    if (!requestId || !["success", "failed"].includes(targetStatus)) {
      res.status(400).json({ error: "Invalid request ID or status" });
      return;
    }

    const [request] = await db
      .select()
      .from(transactions)
      .where(and(
          eq(transactions.transactionId, requestId),
          eq(transactions.transactionType, "payout")
      ))
      .limit(1);

    if (!request) {
      res.status(404).json({ error: "Payout transaction not found" });
      return;
    }

    if (request.transactionStatus !== "pending") {
      res.status(400).json({ error: "Only pending requests can be processed" });
      return;
    }

    const [updated] = await db
      .update(transactions)
      .set({
        transactionStatus: targetStatus,
        transactionMeta: { 
            ...(request.transactionMeta as any),
            adminNote: adminNote || (request.transactionMeta as any)?.note
        },
        transactionUpdatedAt: new Date(),
      })
      .where(eq(transactions.transactionId, requestId))
      .returning();

    // Notify the user
    const statusText = targetStatus === "success" ? "Đã duyệt" : "Bị từ chối";
    await notificationService.sendNotification({
      recipientId: request.transactionUserId,
      title: `Yêu cầu rút tiền ${statusText}`,
      message: targetStatus === "success" 
        ? `Yêu cầu rút ${Number(request.transactionAmount).toLocaleString()} VND của bạn đã được thực hiện thành công.`
        : `Yêu cầu rút tiền của bạn bị từ chối. Lý do: ${adminNote || "Liên hệ Admin để biết thêm chi tiết"}.`,
      type: "system",
    });

    res.json({
      message: `Payout request ${status} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
