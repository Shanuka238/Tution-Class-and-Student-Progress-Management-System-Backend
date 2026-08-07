import Notification from "../models/notificationmodel.js";

class NotificationDAO {
  async createNotification(data) {
    return await Notification.create(data);
  }

  async createBulkNotifications(recordsArray) {
    if (!Array.isArray(recordsArray) || recordsArray.length === 0) return [];
    return await Notification.insertMany(recordsArray);
  }

  async findByReceiverId(receiverUserId, limit = 20) {
    return await Notification.find({ receiver_user_id: receiverUserId })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate("sender_user_id", "first_name last_name email role");
  }

  async markAsRead(notificationId, receiverUserId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, receiver_user_id: receiverUserId },
      { is_read: true },
      { new: true }
    );
  }

  async markAllAsRead(receiverUserId) {
    return await Notification.updateMany(
      { receiver_user_id: receiverUserId, is_read: false },
      { is_read: true }
    );
  }

  async deleteNotification(notificationId, receiverUserId) {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      receiver_user_id: receiverUserId,
    });
  }
}

export default new NotificationDAO();
