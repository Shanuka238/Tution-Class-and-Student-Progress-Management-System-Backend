import attendanceService from "../services/attendanceservice.js";

class AttendanceController {
  /**
   * Fetch attendance status logs for a specific session
   * GET /api/attendance/session/:sessionId
   */
  async getSessionAttendance(req, res, next) {
    try {
      const { sessionId } = req.params;
      const data = await attendanceService.getSessionAttendance(sessionId);

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
   * Process a bulk batch of attendance marks for a session
   * POST /api/attendance/session/:sessionId/bulk
   */
  async saveBulkAttendance(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { records } = req.body; // records: [{ student_id, status }]
      
      const markedByUserId = req.user._id; 

      const result = await attendanceService.submitBulkAttendance(
        sessionId,
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
   * Check if attendance has already been marked for a session
   * GET /api/attendance/session/:sessionId/exists
   */
  async checkSessionAttendanceExists(req, res, next) {
    try {
      const { sessionId } = req.params;
      const marked = await attendanceService.checkSessionAttendanceExists(sessionId);

      return res.status(200).json({
        success: true,
        data: { marked },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve the full year/term attendance register for a specific course
   * GET /api/attendance/register/:courseId
   */
  async getAttendanceRegister(req, res, next) {
    try {
      const { courseId } = req.params;
      const data = await attendanceService.getAttendanceRegister(courseId);

      return res.status(200).json({
        success: true,
        message: "Attendance register loaded successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AttendanceController();