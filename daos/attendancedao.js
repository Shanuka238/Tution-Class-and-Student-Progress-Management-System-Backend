import Attendance from "../models/attendancemodel.js";
import ClassSession from "../models/classsessionmodel.js";

class AttendanceDAO {

  async findBySessionId(sessionId) {
    return await Attendance.find({
      session_id: sessionId
    }).populate({
      path: "student_id",
      select: "student_number"
    });
  }

  async findByCourseIdForRegister(courseId) {
    const sessions = await ClassSession.find({ course_id: courseId }).select("_id");
    const sessionIds = sessions.map(s => s._id);

    if (sessionIds.length === 0) return [];

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
              marked_by: record.marked_by,
              class_id: record.class_id,
              date: record.date
            } 
          },
          upsert: true
        }
      };
    });

    return await Attendance.bulkWrite(operations);
  }

  async hasAttendanceForSession(sessionId) {
    const count = await Attendance.countDocuments({
      session_id: sessionId
    });
    return count > 0;
  }
}

export default new AttendanceDAO();