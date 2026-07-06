import express from "express";
import attendanceControllerActual from "../controllers/attendancecontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// 🔐 Secure the layer with session validation
router.use(protect);

// Check if attendance already exists for a session
router.get("/session/:sessionId/exists", authorize("admin", "teacher"), attendanceControllerActual.checkSessionAttendanceExists);

// Roster lookups for a session
router.get("/session/:sessionId", authorize("admin", "teacher"), attendanceControllerActual.getSessionAttendance);

// Commit bulk arrays for a session
router.post("/session/:sessionId/bulk", authorize("admin", "teacher"), attendanceControllerActual.saveBulkAttendance);

// Register view for a course
router.get("/register/:courseId", authorize("admin", "teacher"), attendanceControllerActual.getAttendanceRegister);

export default router;