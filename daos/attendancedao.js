import Attendance from "../models/attendancemodel.js";

class AttendanceDAO {
  /**
   * Fetch attendance documents for a specific class on a target date
   */
  async findByClassAndDate(classId, dateString) {
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    return await Attendance.find({
      class_id: classId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate({
      path: "student_id",
      select: "student_number"
    });
  }

  /**
   * 🚀 ATOMIC BULK ENGINE
   * Upsert an entire classroom's attendance list inside a single database round-trip
   */
  async bulkUpsert(attendanceRecords) {
    const operations = attendanceRecords.map((record) => {
      const startOfDay = new Date(record.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(record.date);
      endOfDay.setHours(23, 59, 59, 999);

      return {
        updateOne: {
          filter: {
            student_id: record.student_id,
            class_id: record.class_id,
            date: { $gte: startOfDay, $lte: endOfDay }
          },
          update: { 
            $set: { 
              status: record.status, 
              marked_by: record.marked_by,
              date: record.date // Standardizes the exact time signature
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
   * for a given class on a specific date (used to toggle Mark vs Edit button)
   */
  async hasAttendanceForDate(classId, dateString) {
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Attendance.countDocuments({
      class_id: classId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    return count > 0;
  }
}

export default new AttendanceDAO();