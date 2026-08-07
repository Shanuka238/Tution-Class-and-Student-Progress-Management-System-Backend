import notificationDAO from "../daos/notificationdao.js";
import userDAO from "../daos/userdao.js";
import AppError from "../errors/apperror.js";

class NotificationService {
  // Fetch all notifications for a specific user ID
  async getUserNotifications(userId) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    return await notificationDAO.findByReceiverId(userId);
  }

  // Mark a specific notification as read by notification ID and user ID
  async markAsRead(notificationId, userId) {
    if (!notificationId || !userId) {
      throw new AppError("Notification ID and User ID are required", 400);
    }
    const updated = await notificationDAO.markAsRead(notificationId, userId);
    if (!updated) {
      throw new AppError("Notification not found or unauthorized", 404);
    }
    return updated;
  }

  // Mark all unread notifications as read for a specific user ID
  async markAllAsRead(userId) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    return await notificationDAO.markAllAsRead(userId);
  }

  // Delete a specific notification by notification ID and user ID
  async deleteNotification(notificationId, userId) {
    if (!notificationId || !userId) {
      throw new AppError("Notification ID and User ID are required", 400);
    }
    const deleted = await notificationDAO.deleteNotification(notificationId, userId);
    if (!deleted) {
      throw new AppError("Notification not found or unauthorized", 404);
    }
    return deleted;
  }

  // Broadcast announcement notifications to all users or a target role
  async broadcastAnnouncement(senderUserId, { title, message, type = "general", targetRole = "all" }) {
    if (!title || !message) {
      throw new AppError("Title and Message are required for broadcasting", 400);
    }

    const allUsers = await userDAO.findAll();
    let targetUsers = allUsers;

    if (targetRole && String(targetRole).toLowerCase() !== "all") {
      targetUsers = allUsers.filter(
        (u) => u.role && String(u.role).toLowerCase() === String(targetRole).toLowerCase()
      );
    }

    // Map each target user's _id to receiver_user_id
    const records = targetUsers.map((u) => ({
      receiver_user_id: u._id,
      sender_user_id: senderUserId,
      notification_title: title,
      notification_message: message,
      notification_type: type,
      is_read: false,
    }));

    return await notificationDAO.createBulkNotifications(records);
  }

  // Dispatch a single automated system notification to a specific receiver user ID
  async sendSystemNotification(receiverUserId, { title, message, type = "general", senderUserId = null }) {
    if (!receiverUserId) return null;
    const targetId = receiverUserId._id ? receiverUserId._id : receiverUserId;
    const senderId = senderUserId ? (senderUserId._id ? senderUserId._id : senderUserId) : null;

    return await notificationDAO.createNotification({
      receiver_user_id: targetId,
      sender_user_id: senderId,
      notification_title: title,
      notification_message: message,
      notification_type: type,
      is_read: false,
    });
  }

  // Helper to dispatch dual automated notifications to both a student and their linked parent
  async notifyStudentAndParent(studentId, notifPayload) {
    try {
      const studentDAO = (await import("../daos/studentdao.js")).default;
      const parentDAO = (await import("../daos/parentdao.js")).default;

      const studentDoc = await studentDAO.findById(studentId);
      if (!studentDoc) return;

      const studentUserId = studentDoc.user_id ? (studentDoc.user_id._id || studentDoc.user_id) : null;
      if (studentUserId) {
        await this.sendSystemNotification(studentUserId, notifPayload);
      }

      if (studentDoc.parent_id) {
        const parentDoc = await parentDAO.findById(studentDoc.parent_id);
        const parentUserId = parentDoc && parentDoc.user_id ? (parentDoc.user_id._id || parentDoc.user_id) : null;
        if (parentUserId) {
          await this.sendSystemNotification(parentUserId, {
            ...notifPayload,
            title: `[Child Alert] ${notifPayload.title}`,
          });
        }
      }
    } catch (err) {
      console.error("Error in notifyStudentAndParent:", err);
    }
  }
}

export default new NotificationService();
