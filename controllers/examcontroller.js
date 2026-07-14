import examService from "../services/examservice.js";
import { toExamDTO } from "../mappers/examresultmapper.js";

class ExamController {
  async createExam(req, res, next) {
    try {
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
}

export default new ExamController();
