import ClassSession from "../models/classsessionmodel.js";

class ClassSessionDAO {
  async create(sessionData, session) {
    const [newSession] = await ClassSession.create([sessionData], { session });
    return newSession;
  }

  async findById(id) {
    return await ClassSession.findById(id)
      .populate("course_id")
      .populate({
        path: "teacher_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      });
  }

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

  async findByCourseId(courseId) {
    return await ClassSession.find({ course_id: courseId })
      .populate({
        path: "teacher_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .sort({ date: 1 });
  }

  async findByCourseAndDate(courseId, dateString) {
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    return await ClassSession.findOne({
      course_id: courseId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
  }

  async deleteById(id, session) {
    return await ClassSession.findByIdAndDelete(id, { session });
  }

  async deleteByCourseId(courseId, session) {
    return await ClassSession.deleteMany({ course_id: courseId }, { session });
  }
}

export default new ClassSessionDAO();
