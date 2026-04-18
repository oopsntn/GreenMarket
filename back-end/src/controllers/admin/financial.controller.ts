import { Response } from "express";
import {
  and,
  desc,
  eq,
  sql,
} from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  payoutRequests,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { notificationService } from "../../services/notification.service.ts";

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

    const conditions = [];
    if (status) {
      conditions.push(eq(payoutRequests.payoutRequestStatus, status));
    }

    const rows = await db
      .select({
        payoutRequestId: payoutRequests.payoutRequestId,
        userId: payoutRequests.payoutRequestUserId,
        userName: users.userDisplayName,
        userEmail: users.userEmail,
        userRole: users.userBusinessRoleId, // 3 for CTV, 2 for HOST (usually)
        amount: payoutRequests.payoutRequestAmount,
        method: payoutRequests.payoutRequestMethod,
        status: payoutRequests.payoutRequestStatus,
        note: payoutRequests.payoutRequestNote,
        createdAt: payoutRequests.payoutRequestCreatedAt,
        processedAt: payoutRequests.payoutRequestProcessedAt,
      })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.payoutRequestUserId, users.userId))
      .where(and(...conditions))
      .orderBy(desc(payoutRequests.payoutRequestCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payoutRequests)
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
    const { status, adminNote } = req.body; // 'completed' or 'rejected'

    if (!requestId || !["completed", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid request ID or status" });
      return;
    }

    const [request] = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.payoutRequestId, requestId))
      .limit(1);

    if (!request) {
      res.status(404).json({ error: "Payout request not found" });
      return;
    }

    if (request.payoutRequestStatus !== "pending") {
      res.status(400).json({ error: "Only pending requests can be processed" });
      return;
    }

    const [updated] = await db
      .update(payoutRequests)
      .set({
        payoutRequestStatus: status,
        payoutRequestNote: adminNote || request.payoutRequestNote,
        payoutRequestProcessedAt: new Date(),
      })
      .where(eq(payoutRequests.payoutRequestId, requestId))
      .returning();

    // Notify the user
    const statusText = status === "completed" ? "Đã duyệt" : "Bị từ chối";
    await notificationService.sendNotification({
      recipientId: request.payoutRequestUserId,
      title: `Yêu cầu rút tiền ${statusText}`,
      message: status === "completed" 
        ? `Yêu cầu rút ${Number(request.payoutRequestAmount).toLocaleString()} VND của bạn đã được thực hiện thành công.`
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
