import express from "express";
import notificationController from "../controllers/notificationcontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Require authentication for all notification routes
router.use(protect);

// User Notification Center Operations
router.get("/me", notificationController.getMyNotifications);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

// Global Announcement Broadcast (Admin and Teachers)
router.post("/broadcast", authorize("admin", "teacher"), notificationController.broadcastAnnouncement);

export default router;
