import attendanceService from "../services/attendanceservice.js";
import attendanceValidator from "../validators/attendancevalidator.js";
import { toAttendanceDTO, toAttendanceRegisterDTO } from "../mappers/attendancemapper.js";

class AttendanceController {
  // Fetch a student's own attendance records
  async getMyAttendance(req, res, next) {
    try {
      const userId = req.user._id;
      const rawData = await attendanceService.getStudentAttendance(userId);
      const mappedData = rawData.map(toAttendanceDTO);

      return res.status(200).json({
        success: true,
        message: "Your attendance records loaded successfully",
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllAttendance(req, res, next) {
    try {
      const rawData = await attendanceService.getAllAttendance();
      const mappedData = rawData.map(toAttendanceDTO);

      return res.status(200).json({
        success: true,
        message: "All attendance records loaded successfully",
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }

  // Fetch attendance status logs for a specific session
  async getSessionAttendance(req, res, next) {
    try {
      const { sessionId } = req.params;
      const rawData = await attendanceService.getSessionAttendance(sessionId);
      const mappedData = rawData.map(toAttendanceDTO);

      return res.status(200).json({
        success: true,
        message: "Attendance records loaded successfully",
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }

  // Process a bulk batch of attendance marks for a session
  async saveBulkAttendance(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { records } = req.body; // records: [{ student_id, status }]
      
      attendanceValidator.validateBulkAttendanceInput(records);

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

  // Check if attendance has already been marked for a session
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

  // Retrieve the full year/term attendance register for a specific course
  async getAttendanceRegister(req, res, next) {
    try {
      const { courseId } = req.params;
      const rawData = await attendanceService.getAttendanceRegister(courseId);
      
      return res.status(200).json({
        success: true,
        message: "Attendance register loaded successfully",
        data: {
          sessions: rawData.sessions,
          attendance: rawData.attendance.map(toAttendanceDTO)
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AttendanceController();