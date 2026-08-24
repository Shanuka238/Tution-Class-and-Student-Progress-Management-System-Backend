import ClassSession from "../models/classsessionmodel.js";

 //Class Session Data Access Object (DAO)
 //Handles individual session scheduling, venue checking, and timetable clash detection.
class ClassSessionDAO {

   //Insert new class session in transaction
  async create(sessionData, session) {
    const [newSession] = await ClassSession.create([sessionData], { session });
    return newSession;
  }

   //Find session by ID with populated course and educator details
  async findById(id) {
    return await ClassSession.findById(id)
      .populate("course_id")
      .populate({
        path: "teacher_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      });
  }

   //Check if course has another session at the same time on date
  async findCourseConflict(courseId, dateString, startTime, endTime) {
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    return await ClassSession.findOne({
      course_id: courseId,
      date: { $gte: startOfDay, $lte: endOfDay },
      start_time: { $lt: endTime },
      end_time: { $gt: startTime }
    });
  }

  //Check if teacher is already booked in another class at this time
  async findTeacherConflict(teacherId, dateString, startTime, endTime) {
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    return await ClassSession.findOne({
      teacher_id: teacherId,
      date: { $gte: startOfDay, $lte: endOfDay },
      start_time: { $lt: endTime },
      end_time: { $gt: startTime }
    });
  }

  //Check if hall/venue is already occupied by another session at this time
  async findVenueConflict(venue, dateString, startTime, endTime) {
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    return await ClassSession.findOne({
      venue: venue,
      date: { $gte: startOfDay, $lte: endOfDay },
      start_time: { $lt: endTime },
      end_time: { $gt: startTime }
    });
  }

  //Find all sessions for a course
  async findByCourseId(courseId, teacherId = null) {
    const query = { course_id: courseId };
    if (teacherId) {
      query.teacher_id = teacherId;
    }
    return await ClassSession.find(query)
      .populate({
        path: "teacher_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .sort({ date: 1, start_time: 1 });
  }

  //Find all sessions scheduled across courses
  async findAll(query = {}) {
    return await ClassSession.find(query)
      .populate("course_id")
      .populate({
        path: "teacher_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .sort({ date: 1, start_time: 1 });
  }

  //Delete session by ID
  async deleteById(id) {
    return await ClassSession.findByIdAndDelete(id);
  }
}

export default new ClassSessionDAO();
