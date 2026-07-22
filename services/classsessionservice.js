import classSessionDAO from "../daos/classsessiondao.js";
import classDAO from "../daos/classdao.js";
import AppError from "../errors/apperror.js";

class ClassSessionService {
  // Creates a new class session with validation for time formatting and existing sessions
  async createSession(courseId, teacherId, dateString, startTime, endTime, createdBy, venue) {
    // Verify that the specified course exists
    const courseExists = await classDAO.findById(courseId);
    if (!courseExists) {
      throw new AppError("Course not found", 404);
    }

    if (!teacherId) {
      throw new AppError("Teacher assignment is required for a session", 400);
    }

    if (!venue) {
      throw new AppError("Venue location is required for a session", 400);
    }

    // Validate time formatting for both start and end times
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new AppError("Schedule times must match 24-hour HH:MM formatting (e.g. 14:30)", 400);
    }
    
    // Ensure start time is strictly before end time
    if (startTime >= endTime) {
      throw new AppError("Schedule start time cannot happen at or after the scheduled conclusion time", 400);
    }

    // Check if a session already exists for this date to prevent duplicates
    const existing = await classSessionDAO.findByCourseAndDate(courseId, dateString);
    if (existing) {
      throw new AppError("A session already exists for this course on this date", 400);
    }

    // Check for teacher schedule conflicts
    const conflict = await classSessionDAO.findTeacherConflict(teacherId, dateString, startTime, endTime);
    if (conflict) {
      throw new AppError("The selected teacher already has a conflicting session scheduled at this time", 400);
    }

    // Check for venue/room booking conflicts
    const venueConflict = await classSessionDAO.findVenueConflict(venue, dateString, startTime, endTime);
    if (venueConflict) {
      throw new AppError("The selected venue room is already occupied by another session at this time", 400);
    }

    // Create and save the new session
    return await classSessionDAO.create({
      course_id: courseId,
      teacher_id: teacherId,
      date: new Date(dateString),
      start_time: startTime,
      end_time: endTime,
      venue: venue,
      created_by: createdBy
    });
  }

  // Retrieves all sessions for a given course ID.
  async getSessionsForCourse(courseId) {
    return await classSessionDAO.findByCourseId(courseId);
  }

  // Retrieves an existing session for a course on a specific date, or creates a new one if it doesn't exist yet
  async getOrCreateSession(courseId, dateString, userId) {
    // Attempt to locate an existing session for the given date
    let session = await classSessionDAO.findByCourseAndDate(courseId, dateString);
    
    // If no session exists, create a new one
    if (!session) {
      session = await classSessionDAO.create({
        course_id: courseId,
        date: new Date(dateString),
        created_by: userId
      });
    }
    
    return session;
  }

  // Deletes a session by its ID.
  async deleteSession(sessionId) {
    return await classSessionDAO.deleteById(sessionId);
  }
}

export default new ClassSessionService();
