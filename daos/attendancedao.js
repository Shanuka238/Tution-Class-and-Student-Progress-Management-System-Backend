import Attendance from "../models/attendancemodel.js";
import ClassSession from "../models/classsessionmodel.js";

class AttendanceDAO {
  /**
   * Fetch attendance documents for a specific class session
   */
  async findBySessionId(sessionId) {
    return await Attendance.find({
      session_id: sessionId
    }).populate({
      path: "student_id",
      select: "student_number"
    });
  }

  /**
   * Fetch all attendance records across all sessions of a specific course (for Register view)
   */
  async findByCourseIdForRegister(courseId) {
    // 1. Get all session IDs for the course
    const sessions = await ClassSession.find({ course_id: courseId }).select("_id");
    const sessionIds = sessions.map(s => s._id);

    if (sessionIds.length === 0) return [];

    // 2. Fetch all attendance logs for those sessions
    return await Attendance.find({
      session_id: { $in: sessionIds }
    }).populate({
      path: "student_id",
      select: "student_number user_id",
      populate: {
        path: "user_id",
        select: "first_name last_name email"
      }
    });
  }

  /**
   * 🚀 ATOMIC BULK ENGINE
   * Upsert an entire classroom's attendance list inside a single database round-trip
   */
  async bulkUpsert(attendanceRecords) {
    const operations = attendanceRecords.map((record) => {
      return {
        updateOne: {
          filter: {
            student_id: record.student_id,
            session_id: record.session_id
          },
          update: { 
            $set: { 
              status: record.status, 
              marked_by: record.marked_by
            } 
          },
          upsert: true
        }
      };
    });

    return await Attendance.bulkWrite(operations);
  }

  /**
   * Lightweight existence check — returns true if any attendance records exist
   * for a given session (used to toggle Mark vs Edit button)
   */
  async hasAttendanceForSession(sessionId) {
    const count = await Attendance.countDocuments({
      session_id: sessionId
    });
    return count > 0;
  }
}

export default new AttendanceDAO();