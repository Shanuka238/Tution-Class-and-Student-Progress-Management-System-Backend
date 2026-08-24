import express from "express";
import classController from "../controllers/classcontroller.js";
import classSessionController from "../controllers/classsessioncontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Require authentication for all class management routes
router.use(protect);

// Class Directory & Timetable Queries
router.get("/", classController.getActiveClasses);
router.get("/timetable", classController.getTimetable);
router.get("/student/me", authorize("student"), classController.getMyClasses);

// Class Management & Student Enrollment Handlers
router.post("/", authorize("admin"), classController.createClass);
router.post("/enroll", authorize("admin", "teacher"), classController.enrollStudent);
router.post("/drop", authorize("admin", "teacher"), classController.dropStudent);
router.delete("/:id", authorize("admin"), classController.deleteClass);

// Timetable Session Management
router.get("/:courseId/sessions", classSessionController.getSessionsForCourse);
router.post("/:courseId/sessions", authorize("admin"), classSessionController.createSession);
router.delete("/sessions/:id", authorize("admin"), classSessionController.deleteSession);

export default router;