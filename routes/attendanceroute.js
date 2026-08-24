import express from "express";
import attendanceControllerActual from "../controllers/attendancecontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Require authentication for all attendance endpoints
router.use(protect);

// Student own attendance logs
router.get("/student/me", authorize("student"), attendanceControllerActual.getMyAttendance);

// Administrator system-wide attendance log view
router.get("/all", authorize("admin"), attendanceControllerActual.getAllAttendance);

// Session Attendance Register & Marking Handlers (Admin & Teachers)
router.get("/session/:sessionId/exists", authorize("admin", "teacher"), attendanceControllerActual.checkSessionAttendanceExists);
router.get("/session/:sessionId", authorize("admin", "teacher"), attendanceControllerActual.getSessionAttendance);
router.post("/session/:sessionId/bulk", authorize("admin", "teacher"), attendanceControllerActual.saveBulkAttendance);
router.get("/register/:courseId", authorize("admin", "teacher"), attendanceControllerActual.getAttendanceRegister);

export default router;