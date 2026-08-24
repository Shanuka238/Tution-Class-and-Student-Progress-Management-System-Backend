import Attendance from "../models/attendancemodel.js";
import ClassSession from "../models/classsessionmodel.js";

 //Attendance Data Access Object (DAO)
 //Database query interface for session attendance marks, student history, and registers.
class AttendanceDAO {

   //Find attendance records for a specific session ID
  async findBySessionId(sessionId) {
    return await Attendance.find({
      session_id: sessionId
    }).populate({
      path: "student_id",
      select: "student_number"
    });
  }

   //Find all attendance records for a specific student ID
  async findByStudentId(studentId) {
    return await Attendance.find({
      student_id: studentId
    })
      .populate({
        path: "session_id",
        select: "date start_time end_time"
      })
      .populate({
        path: "class_id",
        select: "class_name subject"
      })
      .sort({ date: -1 });
  }

   //Find all attendance records across all sessions of a course for register generation
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

   //Upsert a batch of attendance marks (insert or update)
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
              date: record.date || new Date()
            } 
          },
          upsert: true,
        },
      };
    });

    return await Attendance.bulkWrite(operations);
  }

  //Find all attendance records in system
  async findAll() {
    return await Attendance.find()
      .populate({
        path: "student_id",
        select: "student_number user_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .populate({
        path: "session_id",
        select: "date start_time end_time venue"
      })
      .populate({
        path: "class_id",
        select: "class_name subject grade"
      })
      .sort({ created_at: -1 });
  }
}

export default new AttendanceDAO();