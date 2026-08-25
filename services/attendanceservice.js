import attendanceDAO from "../daos/attendancedao.js";
import classSessionDAO from "../daos/classsessiondao.js";
import AppError from "../errors/apperror.js";
import { ATTENDANCE_STATUS_VALUES } from "../enums/attendanceenum.js";
import studentDAO from "../daos/studentdao.js";

class AttendanceService {
  // Fetch a student's own attendance records
  async getStudentAttendance(userId) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    const student = await studentDAO.findByUserId(userId);
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }
    return await attendanceDAO.findByStudentId(student._id);
  }

  async getAllAttendance() {
    return await attendanceDAO.findAll();
  }

  // Fetch attendance status logs for a specific class session
  async getSessionAttendance(sessionId) {
    // Validate session ID
    if (!sessionId) {
      throw new AppError("Session ID parameter is required", 400);
    }
    // Fetch and return attendance records
    return await attendanceDAO.findBySessionId(sessionId);
  }

  // Submits a bulk attendance block for a specific session
  async submitBulkAttendance(sessionId, recordsArray, markedByUserId) {
    // Validate payload existence and array format
    if (!sessionId || !Array.isArray(recordsArray) || recordsArray.length === 0) {
      throw new AppError("Invalid payload data map provided for attendance processing", 400);
    }

    // Fetch the session to populate legacy index fields (class_id and date)
    const session = await classSessionDAO.findById(sessionId);
    if (!session) {
      throw new AppError("Class session not found", 404);
    }

    // Map and sanitize the incoming records
    const sanitizedRecords = recordsArray.map((record) => {
      // Validate individual record structure and status value
      if (!record.student_id || !ATTENDANCE_STATUS_VALUES.includes(record.status)) {
        throw new AppError("Roster values contain missing IDs or illegal status flags", 400);
      }
      return {
        session_id: sessionId,
        student_id: record.student_id,
        status: record.status,
        marked_by: markedByUserId,
        class_id: session.course_id,
        date: session.date
      };
    });

    // Process bulk upsert operation in database
    const saved = await attendanceDAO.bulkUpsert(sanitizedRecords);

    // Trigger real-time attendance alerts for students & parents
    try {
      const notificationService = (await import("./notificationservice.js")).default;
      const className = session.course_id?.class_name || session.course_id?.subject || "Class Session";
      const sessionDateFormatted = session.date ? new Date(session.date).toLocaleDateString() : new Date().toLocaleDateString();

      for (const rec of sanitizedRecords) {
        const studentId = rec.student_id?._id || rec.student_id;
        const statusUpper = String(rec.status).toUpperCase();
        let statusEmoji = "✓";
        if (rec.status === "absent") statusEmoji = "⚠️";
        if (rec.status === "late") statusEmoji = "⏰";

        await notificationService.notifyStudentAndParent(studentId, {
          title: `Attendance Marked: ${statusUpper} ${statusEmoji} (${className})`,
          message: `Attendance has been marked as ${statusUpper} for ${className} on ${sessionDateFormatted}.`,
          type: "attendance",
        });
      }
    } catch (notifErr) {
      console.error("Error triggering attendance notifications:", notifErr);
    }

    return saved;
  }


  // Returns true/false if attendance has already been recorded for a session
  async checkSessionAttendanceExists(sessionId) {
    // Validate session ID
    if (!sessionId) {
      throw new AppError("Session ID is required", 400);
    }
    // Check database for existing records
    return await attendanceDAO.hasAttendanceForSession(sessionId);
  }

  // Fetch all sessions and attendance records for a specific course to construct the register
  async getAttendanceRegister(courseId) {
    // Validate course ID
    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    // Fetch all sessions associated with the course
    const sessions = await classSessionDAO.findByCourseId(courseId);
    
    // Fetch all attendance records across all sessions for the course
    const attendanceRecords = await attendanceDAO.findByCourseIdForRegister(courseId);

    // Return combined dataset
    return {
      sessions,
      attendance: attendanceRecords
    };
  }
}

export default new AttendanceService();