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

    // 1. Check for course schedule time conflicts (allow multiple sessions on the same day as long as times don't overlap)
    const courseConflict = await classSessionDAO.findCourseConflict(courseId, dateString, startTime, endTime);
    if (courseConflict) {
      throw new AppError(
        `This course already has a session scheduled from ${courseConflict.start_time} to ${courseConflict.end_time} on this date. Times cannot overlap.`,
        400
      );
    }

    // 2. Check for teacher schedule conflicts
    const teacherConflict = await classSessionDAO.findTeacherConflict(teacherId, dateString, startTime, endTime);
    if (teacherConflict) {
      throw new AppError(
        `The selected educator already has another session scheduled from ${teacherConflict.start_time} to ${teacherConflict.end_time} on this date.`,
        400
      );
    }

    // 3. Check for venue/room booking conflicts
    const venueConflict = await classSessionDAO.findVenueConflict(venue, dateString, startTime, endTime);
    if (venueConflict) {
      throw new AppError(
        `The selected room/venue '${venue}' is already booked from ${venueConflict.start_time} to ${venueConflict.end_time} on this date.`,
        400
      );
    }

    // Create and save the new session
    const session = await classSessionDAO.create({
      course_id: courseId,
      teacher_id: teacherId,
      date: new Date(dateString),
      start_time: startTime,
      end_time: endTime,
      venue: venue,
      created_by: createdBy
    });

    // Auto-trigger notifications for teacher and enrolled students/parents
    try {
      const Teacher = (await import("../models/teachermodel.js")).default;
      const StudentClass = (await import("../models/studentclassmodel.js")).default;
      const notificationService = (await import("./notificationservice.js")).default;

      const className = courseExists.class_name || courseExists.subject || "Class";
      const sessionDateFormatted = new Date(dateString).toLocaleDateString();

      // 1. Notify Assigned Teacher
      const teacherDoc = await Teacher.findById(teacherId);
      if (teacherDoc && teacherDoc.user_id) {
        await notificationService.sendSystemNotification(teacherDoc.user_id, {
          title: `New Class Session Assigned: ${className}`,
          message: `Scheduled on ${sessionDateFormatted} (${startTime} - ${endTime}) at ${venue}.`,
          type: "general",
        });
      }

      // 2. Notify Enrolled Students & Parents
      const notifData = {
        title: `Class Session Scheduled: ${className}`,
        message: `Date: ${sessionDateFormatted} (${startTime} - ${endTime}) | Venue: ${venue}`,
        type: "general",
      };
      const enrolled = await StudentClass.find({ class_id: courseId });
      for (const sc of enrolled) {
        if (sc.student_id) {
          await notificationService.notifyStudentAndParent(sc.student_id, notifData);
        }
      }
    } catch (notifErr) {
      console.error("Error sending class session notifications:", notifErr);
    }

    return session;
  }

  // Retrieves all sessions for a given course ID (optionally filtered for teachers)
  async getSessionsForCourse(courseId, user = null) {
    let sessions = await classSessionDAO.findByCourseId(courseId);
    if (user && user.role === "teacher") {
      const teacherDAO = (await import("../daos/teacherdao.js")).default;
      const teacher = await teacherDAO.findByUserId(user._id);
      if (teacher) {
        const teacherIdStr = teacher._id.toString();
        sessions = sessions.filter((s) => {
          const sessTeacherId = s.teacher_id?._id || s.teacher_id;
          return sessTeacherId && sessTeacherId.toString() === teacherIdStr;
        });
      } else {
        sessions = [];
      }
    }
    return sessions;
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
