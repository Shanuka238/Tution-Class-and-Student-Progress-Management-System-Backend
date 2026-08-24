import Notification from "../models/notificationmodel.js";

 //System Notification Data Access Object (DAO)
 //Database query interface for notification inboxes, read markers, and bulk message delivery.
class NotificationDAO {

   //Insert a single notification
  async createNotification(data) {
    return await Notification.create(data);
  }

   //Bulk insert notifications for multiple users
  async createBulkNotifications(recordsArray) {
    if (!Array.isArray(recordsArray) || recordsArray.length === 0) return [];
    return await Notification.insertMany(recordsArray);
  }

   //Find recent notifications for a user
  async findByReceiverId(receiverUserId, limit = 20) {
    return await Notification.find({ receiver_user_id: receiverUserId })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate("sender_user_id", "first_name last_name email role");
  }

   //Mark a notification as read
  async markAsRead(notificationId, receiverUserId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, receiver_user_id: receiverUserId },
      { is_read: true },
      { new: true }
    );
  }

  //Mark all notifications for a user as read
  async markAllAsRead(receiverUserId) {
    return await Notification.updateMany(
      { receiver_user_id: receiverUserId, is_read: false },
      { is_read: true }
    );
  }

  //Delete a notification by ID for a user
  async deleteNotification(notificationId, receiverUserId) {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      receiver_user_id: receiverUserId,
    });
  }
}

export default new NotificationDAO();
