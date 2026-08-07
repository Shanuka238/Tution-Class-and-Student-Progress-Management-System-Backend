import express from "express";
import notificationController from "../controllers/notificationcontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/me", notificationController.getMyNotifications);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

router.post("/broadcast", authorize("admin", "teacher"), notificationController.broadcastAnnouncement);

export default router;
