import attendanceDAO from "../daos/attendancedao.js";
import AppError from "../errors/apperror.js";

class AttendanceService {
  /**
   * Fetch or initialize an attendance roster grid for mapping inside a table
   */
  async getClassAttendanceByDate(classId, dateString) {
    if (!classId || !dateString) {
      throw new AppError("Class ID and target tracking date parameters are required", 400);
    }
    return await attendanceDAO.findByClassAndDate(classId, dateString);
  }

  /**
   * Submits a chunk array block directly down to the bulk upsert wrapper
   */
  async submitBulkAttendance(classId, dateString, recordsArray, markedByUserId) {
    if (!classId || !dateString || !Array.isArray(recordsArray) || recordsArray.length === 0) {
      throw new AppError("Invalid payload data map provided for attendance processing", 400);
    }

    // Sanitize values and inject issuer authorization context IDs
    const sanitizedRecords = recordsArray.map((record) => {
      if (!record.student_id || !["present", "absent", "late"].includes(record.status)) {
        throw new AppError("Roster values contain missing IDs or illegal status flags", 400);
      }
      return {
        class_id: classId,
        student_id: record.student_id,
        status: record.status,
        date: new Date(dateString),
        marked_by: markedByUserId
      };
    });

    return await attendanceDAO.bulkUpsert(sanitizedRecords);
  }

  /**
   * Returns true/false if attendance has already been recorded for the class on a given date
   */
  async checkAttendanceExists(classId, dateString) {
    if (!classId || !dateString) {
      throw new AppError("Class ID and date are required", 400);
    }
    return await attendanceDAO.hasAttendanceForDate(classId, dateString);
  }
}

export default new AttendanceService();