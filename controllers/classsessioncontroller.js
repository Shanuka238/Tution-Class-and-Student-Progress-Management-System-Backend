import classSessionService from "../services/classsessionservice.js";
import { toClassSessionDTO } from "../mappers/classmapper.js";

class ClassSessionController {
  // Create a new session for a specific course
  async createSession(req, res, next) {
    try {
      const { courseId } = req.params;
      const { date, start_time, end_time, teacher_id } = req.body;
      const createdBy = req.user._id;

      const rawData = await classSessionService.createSession(courseId, teacher_id, date, start_time, end_time, createdBy);
      return res.status(201).json({
        success: true,
        message: "Class session scheduled successfully",
        data: toClassSessionDTO(rawData),
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve all sessions for a specific course
  async getSessionsForCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const rawData = await classSessionService.getSessionsForCourse(courseId);
      const mappedData = rawData.map(toClassSessionDTO);
      return res.status(200).json({
        success: true,
        message: "Sessions retrieved successfully",
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a specific session by its ID
  async deleteSession(req, res, next) {
    try {
      const { id } = req.params;
      await classSessionService.deleteSession(id);
      return res.status(200).json({
        success: true,
        message: "Session deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClassSessionController();
