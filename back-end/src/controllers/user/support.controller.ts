import { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth";
import { operationTasks, users, businessRoles } from "../../models/schema/index";
import { notificationService } from "../../services/notification.service";

export const submitSupportRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!title?.trim() || !description?.trim()) {
      res.status(400).json({ error: "Title and description are required" });
      return;
    }

    // Find an Operations Staff to assign the task to
    // Look up users whose business role id = 5 (OPERATION_STAFF) directly
    const staffList = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userBusinessRoleId, 5));

    let assignedStaffId: number | null = null;
    if (staffList.length > 0) {
      const randomIndex = Math.floor(Math.random() * staffList.length);
      assignedStaffId = staffList[randomIndex].userId;
    }

    // Insert new SUPPORT ticket
    const [newTask] = await db
      .insert(operationTasks)
      .values({
        ticketType: 'SUPPORT',
        ticketCreatorId: userId,
        ticketAssigneeId: assignedStaffId,
        ticketTitle: title.trim(),
        ticketContent: description.trim(),
        ticketPriority: 'medium',
        ticketStatus: 'open',
      })
      .returning();

    // Notify assigned staff
    if (assignedStaffId) {
      try {
        await notificationService.sendNotification({
          recipientId: assignedStaffId,
          title: "Yêu cầu hỗ trợ mới",
          message: `Bạn đã được phân công xử lý yêu cầu hỗ trợ mới: "${title.trim()}"`,
          type: "info",
          metaData: { ticketId: newTask.ticketId, type: "support" }
        });
      } catch (notifError) {
        console.error("Support notification failed:", notifError);
      }
    }

    res.status(201).json({
      message: "Yêu cầu hỗ trợ đã được gửi thành công.",
      task: newTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
