import classSessionService from "../services/classsessionservice.js";
import { toClassSessionDTO } from "../mappers/classmapper.js";

class ClassSessionController {
  // Create a new session for a specific course
  async createSession(req, res, next) {
    try {
      const { courseId } = req.params;
      const { date, start_time, end_time, teacher_id, venue } = req.body;
      const createdBy = req.user._id;

      const rawData = await classSessionService.createSession(courseId, teacher_id, date, start_time, end_time, createdBy, venue);
      return res.status(201).json({
        success: true,
        message: "Class session scheduled successfully",
        data: toClassSessionDTO(rawData),
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve sessions for a specific course (filtered by teacher if user is a teacher)
  async getSessionsForCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      let rawData = await classSessionService.getSessionsForCourse(courseId);

      if (req.user && req.user.role === "teacher") {
        const teacherDAO = (await import("../daos/teacherdao.js")).default;
        const teacher = await teacherDAO.findByUserId(req.user._id);
        if (teacher) {
          const teacherIdStr = teacher._id.toString();
          rawData = rawData.filter((s) => {
            const sessTeacherId = s.teacher_id?._id || s.teacher_id;
            return sessTeacherId && sessTeacherId.toString() === teacherIdStr;
          });
        } else {
          rawData = [];
        }
      }

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
