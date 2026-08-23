import notificationService from "../services/notificationservice.js";
import notificationValidator from "../validators/notificationvalidator.js";

class NotificationController {
  // Retrieve all notification records for the logged-in user
  async getMyNotifications(req, res, next) {
    try {
      const userId = req.user._id;
      const notifications = await notificationService.getUserNotifications(userId);

      return res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark a single notification as read by ID
  async markAsRead(req, res, next) {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, userId);

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark all unread notifications as read for the logged-in user
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user._id;
      await notificationService.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a specific notification record by ID
  async deleteNotification(req, res, next) {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      await notificationService.deleteNotification(id, userId);

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Broadcast an announcement notification to target roles or all users
  async broadcastAnnouncement(req, res, next) {
    try {
      const senderUserId = req.user._id;
      const { title, message, type, targetRole } = req.body;

      notificationValidator.validateBroadcastInput(req.body);

      const createdRecords = await notificationService.broadcastAnnouncement(senderUserId, {
        title,
        message,
        type,
        targetRole,
      });

      return res.status(201).json({
        success: true,
        message: `Successfully sent broadcast alert to ${createdRecords.length} users`,
        data: { count: createdRecords.length },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
