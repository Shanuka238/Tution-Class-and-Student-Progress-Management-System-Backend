import express from "express";
import classController from "../controllers/classcontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// 🔐 Secure the entire endpoint tree layer under an active session perimeter
router.use(protect);

// 📖 Anyone authenticated (including students/parents) can view the running class schedule
router.get("/", classController.getActiveClasses);
router.get("/timetable", classController.getTimetable);

// 🛠️ Management actions are restricted to Admins and Teachers exclusively
router.post("/", authorize("admin", "teacher"), classController.createClass);
router.post("/enroll", authorize("admin", "teacher"), classController.enrollStudent);
router.post("/drop", authorize("admin", "teacher"), classController.dropStudent);
router.delete("/:id", authorize("admin", "teacher"), classController.deleteClass);

export default router;