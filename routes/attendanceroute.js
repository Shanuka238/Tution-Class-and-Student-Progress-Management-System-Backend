import express from "express";
import attendanceControllerActual from "../controllers/attendancecontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// 🔐 Secure the layer with session validation
router.use(protect);

// Check if attendance already exists for a class on a given date (must be before /:classId)
router.get("/:classId/exists", authorize("admin", "teacher"), attendanceControllerActual.checkAttendanceExists);

// Roster lookups can be processed by management structures
router.get("/:classId", authorize("admin", "teacher"), attendanceControllerActual.getClassAttendance);

// Commit bulk arrays
router.post("/:classId/bulk", authorize("admin", "teacher"), attendanceControllerActual.saveBulkAttendance);

export default router;