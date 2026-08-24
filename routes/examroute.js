import express from "express";
import examController from "../controllers/examcontroller.js";
import resultController from "../controllers/resultcontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Require authentication for all exam endpoints
router.use(protect);

// Student Exam Marks & Result History
router.get("/results/me", authorize("student", "admin", "teacher", "parent"), resultController.getMyResults);

// Exam Assessments Directory & Management
router.get("/", authorize("admin", "teacher", "student", "parent"), examController.getAllExams);
router.post("/", authorize("admin", "teacher"), examController.createExam);
router.get("/class/:classId", authorize("admin", "teacher"), examController.getExamsByClass);
router.get("/:examId", authorize("admin", "teacher"), examController.getExamById);

// Grade Entry & Result Publishing Handlers
router.post("/:examId/results", authorize("admin", "teacher"), resultController.submitBulkResults);
router.get("/:examId/results", authorize("admin", "teacher"), resultController.getResultsByExam);

export default router;
