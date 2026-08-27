import examService from "../services/examservice.js";
import examValidator from "../validators/examvalidator.js";
import { toExamDTO } from "../mappers/examresultmapper.js";

class ExamController {
  // Create a new exam for a tuition class
  async createExam(req, res, next) {
    try {
      examValidator.validateCreateExamInput(req.body);
      const rawData = await examService.createExam(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: "Exam created successfully",
        data: toExamDTO(rawData),
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve all exams based on role
  async getAllExams(req, res, next) {
    try {
      const rawData = await examService.getAllExams(req.user);
      const mappedData = rawData.map(toExamDTO);
      return res.status(200).json({
        success: true,
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve all exams scheduled for a specific class ID
  async getExamsByClass(req, res, next) {
    try {
      const { classId } = req.params;
      const rawData = await examService.getExamsByClass(classId);
      const mappedData = rawData.map(toExamDTO);
      return res.status(200).json({
        success: true,
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }

  // Fetch detailed information for a single exam by ID
  async getExamById(req, res, next) {
    try {
      const { examId } = req.params;
      const rawData = await examService.getExamById(examId);
      return res.status(200).json({
        success: true,
        data: toExamDTO(rawData),
      });
    } catch (error) {
      next(error);
    }
  }

  // Update exam details (exam_title, exam_date, start_time, end_time)
  async updateExam(req, res, next) {
    try {
      const { examId } = req.params;
      const rawData = await examService.updateExam(examId, req.body, req.user);
      return res.status(200).json({
        success: true,
        message: "Exam updated successfully",
        data: toExamDTO(rawData),
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete exam and associated results
  async deleteExam(req, res, next) {
    try {
      const { examId } = req.params;
      const result = await examService.deleteExam(examId, req.user);
      return res.status(200).json({
        success: true,
        message: result.message || "Exam deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExamController();

