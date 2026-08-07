import mongoose from "mongoose";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_VALUES } from "../enums/notificationenum.js";

const notificationSchema = new mongoose.Schema(
  {
    receiver_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notification_title: {
      type: String,
      required: true,
      trim: true,
    },
    notification_message: {
      type: String,
      required: true,
      trim: true,
    },
    notification_type: {
      type: String,
      enum: NOTIFICATION_TYPE_VALUES,
      default: NOTIFICATION_TYPES.GENERAL,
    },
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
