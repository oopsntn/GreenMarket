import { and, desc, eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import { systemNotifications } from "../models/schema/system-notifications.ts";
import { sendToUser, broadcastToAdmins } from "../config/socket.ts";

export const notificationService = {
  /**
   * Send a notification to a specific user
   */
  async sendNotification(data: {
    recipientId: number;
    title: string;
    message: string;
    type?: string;
    metaData?: any;
  }) {
    try {
      // 1. Save to database
      const [newNotification] = await db
        .insert(systemNotifications)
        .values({
          recipientId: data.recipientId,
          title: data.title,
          message: data.message,
          type: data.type || "system",
          metaData: data.metaData || {},
        })
        .returning();

      // 2. Send via Socket.io if user is online
      try {
        sendToUser(data.recipientId, "new_notification", newNotification);
      } catch (socketError) {
        console.error("Socket notification delivery failed (userId:", data.recipientId, "):", socketError);
      }

      return newNotification;
    } catch (error) {
      console.error("Failed to save and send notification:", error);
      // Re-throw so callers know it wasn't saved, but we'll catch it in controllers too
      throw error;
    }
  },

  /**
   * Send a notification to all admins
   */
  async notifyAdmins(data: {
    title: string;
    message: string;
    type?: string;
    metaData?: any;
  }) {
    try {
      broadcastToAdmins("admin_alert", {
        ...data,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to notify admins via socket:", error);
    }
  },

  /**
   * Get notification history for a user
   */
  async getNotifications(userId: number, limit = 50) {
    return await db.query.systemNotifications.findMany({
      where: eq(systemNotifications.recipientId, userId),
      orderBy: [desc(systemNotifications.createdAt)],
      limit: limit,
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number, userId: number) {
    return await db
      .update(systemNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(systemNotifications.notificationId, notificationId),
          eq(systemNotifications.recipientId, userId)
        )
      )
      .returning();
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number) {
    return await db
      .update(systemNotifications)
      .set({ isRead: true })
      .where(eq(systemNotifications.recipientId, userId))
      .returning();
  }
};
