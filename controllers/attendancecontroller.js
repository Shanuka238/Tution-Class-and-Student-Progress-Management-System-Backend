import attendanceService from "../services/attendanceservice.js";

class AttendanceController {
  /**
   * Fetch attendance status logs for a class on a specific date
   * GET /api/attendance/:classId?date=2026-07-04
   */
  async getClassAttendance(req, res, next) {
    try {
      const { classId } = req.params;
      const { date } = req.query; // Expecting ISO string or YYYY-MM-DD

      const data = await attendanceService.getClassAttendanceByDate(classId, date);

      return res.status(200).json({
        success: true,
        message: "Attendance records loaded successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process a bulk batch of attendance marks
   * POST /api/attendance/:classId/bulk
   */
  async saveBulkAttendance(req, res, next) {
    try {
      const { classId } = req.params;
      const { date, records } = req.body; // records: [{ student_id, status }]
      
      // Pull issuer ID safely out of req.user injected by protect middleware
      const markedByUserId = req.user._id; 

      const result = await attendanceService.submitBulkAttendance(
        classId,
        date,
        records,
        markedByUserId
      );

      return res.status(200).json({
        success: true,
        message: `Successfully processed attendance data matrix rows`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if attendance has already been marked for a class on a specific date
   * GET /api/attendance/:classId/exists?date=YYYY-MM-DD
   */
  async checkAttendanceExists(req, res, next) {
    try {
      const { classId } = req.params;
      const { date } = req.query;

      const marked = await attendanceService.checkAttendanceExists(classId, date);

      return res.status(200).json({
        success: true,
        data: { marked },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AttendanceController();