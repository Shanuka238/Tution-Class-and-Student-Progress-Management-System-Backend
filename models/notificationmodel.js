import mongoose from "mongoose";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_VALUES } from "../enums/notificationenum.js";


 //System Notification Schema
 //Delivers alerts, exam releases, payment reminders, and broadcast messages to users.
const notificationSchema = new mongoose.Schema(
  {
    // User who receives this notification
    receiver_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User who originated the notification (null for automated system alerts)
    sender_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Notification title or headline
    notification_title: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification body text / message
    notification_message: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification category: general, exam, fee, attendance, announcement
    notification_type: {
      type: String,
      enum: NOTIFICATION_TYPE_VALUES,
      default: NOTIFICATION_TYPES.GENERAL,
    },

    // Read/unread flag
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
