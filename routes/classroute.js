import express from "express";
import classController from "../controllers/classcontroller.js";
import classSessionController from "../controllers/classsessioncontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", classController.getActiveClasses);
router.get("/timetable", classController.getTimetable);
router.get("/student/me", authorize("student"), classController.getMyClasses);

router.post("/", authorize("admin"), classController.createClass);
router.post("/enroll", authorize("admin", "teacher"), classController.enrollStudent);
router.post("/drop", authorize("admin", "teacher"), classController.dropStudent);
router.delete("/:id", authorize("admin"), classController.deleteClass);

router.get("/:courseId/sessions", classSessionController.getSessionsForCourse);
router.post("/:courseId/sessions", authorize("admin"), classSessionController.createSession);
router.delete("/sessions/:id", authorize("admin"), classSessionController.deleteSession);

export default router;