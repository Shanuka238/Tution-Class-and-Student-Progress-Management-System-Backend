import classSessionService from "../services/classsessionservice.js";

class ClassSessionController {
  async createSession(req, res, next) {
    try {
      const { courseId } = req.params;
      const { date, start_time, end_time } = req.body;
      const createdBy = req.user._id;

      const data = await classSessionService.createSession(courseId, date, start_time, end_time, createdBy);
      return res.status(201).json({
        success: true,
        message: "Class session scheduled successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionsForCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const data = await classSessionService.getSessionsForCourse(courseId);
      return res.status(200).json({
        success: true,
        message: "Sessions retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

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
