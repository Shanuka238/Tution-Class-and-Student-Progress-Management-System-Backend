import AppError from "../errors/apperror.js";
import { NOTIFICATION_TYPE_VALUES } from "../enums/notificationenum.js";
import { ROLE_VALUES } from "../enums/userenum.js";


//System Notification and Broadcast Validator
class NotificationValidator {
  
   //Validate broadcast announcement payload
   
  validateBroadcastInput(data) {
    const { title, message, type, targetRole } = data;

    if (!title || !title.trim()) {
      throw new AppError("Notification title is required", 400);
    }

    if (!message || !message.trim()) {
      throw new AppError("Notification message is required", 400);
    }

    if (type && !NOTIFICATION_TYPE_VALUES.includes(type)) {
      throw new AppError(`Invalid notification type. Allowed values: ${NOTIFICATION_TYPE_VALUES.join(", ")}`, 400);
    }

    if (targetRole && targetRole !== "all" && !ROLE_VALUES.includes(targetRole)) {
      throw new AppError(`Invalid targetRole. Allowed values: all, ${ROLE_VALUES.join(", ")}`, 400);
    }

    return true;
  }
}

export default new NotificationValidator();
