import parentService from "../services/parentservice.js";

class ParentController {
  // GET /api/parents/me/children
  async getMyChildren(req, res, next) {
    try {
      const children = await parentService.getMyChildren(req.user._id);
      return res.status(200).json({
        success: true,
        message: "Linked children retrieved successfully",
        data: children,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/parents/children/:studentId/progress
  async getChildProgress(req, res, next) {
    try {
      const { studentId } = req.params;
      const progress = await parentService.getChildProgress(req.user._id, studentId);
      return res.status(200).json({
        success: true,
        message: "Child academic progress retrieved successfully",
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ParentController();
