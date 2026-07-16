import express from "express";
import examController from "../controllers/examcontroller.js";
import resultController from "../controllers/resultcontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/results/me", authorize("student"), resultController.getMyResults);

router.post("/", authorize("admin", "teacher"), examController.createExam);
router.get("/class/:classId", authorize("admin", "teacher"), examController.getExamsByClass);
router.get("/:examId", authorize("admin", "teacher"), examController.getExamById);

router.post("/:examId/results", authorize("admin", "teacher"), resultController.submitBulkResults);
router.get("/:examId/results", authorize("admin", "teacher"), resultController.getResultsByExam);

export default router;
