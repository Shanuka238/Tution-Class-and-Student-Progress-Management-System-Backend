import mongoose from "mongoose";
import classDAO from "../daos/classdao.js";
import studentClassDAO from "../daos/studentclassdao.js";
import AppError from "../errors/apperror.js";

class ClassService {
  // Create a new class with schedule conflict checking
  async createClass(classPayload) {
    const { teacher_id, venue, schedule_days, schedule_start_time, schedule_end_time } = classPayload;

    // Check for venue and teacher scheduling conflicts
    const conflict = await classDAO.findScheduleConflict(
      teacher_id,
      venue,
      schedule_days,
      schedule_start_time,
      schedule_end_time
    );

    if (conflict) {
      if (conflict.venue === venue) {
        throw new AppError(`Venue Conflict: ${venue} is already booked on ${schedule_days} between ${conflict.schedule_start_time} - ${conflict.schedule_end_time}`, 400);
      }
      if (conflict.teacher_id.toString() === teacher_id.toString()) {
        throw new AppError(`Teacher Conflict: This educator is already booked to teach a class on ${schedule_days} during this time frame`, 400);
      }
    }

    // Save class to database
    return await classDAO.create(classPayload);
  }

  // Fetch all active classes
  async getActiveClasses() {
    return await classDAO.findAllActive();
  }

  // Enroll a student in a class with capacity check
  async assignStudentToClass(studentId, classId) {
    const targetClass = await classDAO.findById(classId);
    if (!targetClass || !targetClass.is_active) {
      throw new AppError("Target class does not exist or has been deactivated", 404);
    }

    // Check if student is already enrolled
    const existingEnrollment = await studentClassDAO.findEnrollment(studentId, classId);
    if (existingEnrollment) {
      if (existingEnrollment.status === "active") {
        throw new AppError("Student is already actively enrolled in this class", 400);
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify class has available seats
      const activeEnrolledCount = await studentClassDAO.countActiveStudents(classId);
      if (activeEnrolledCount >= targetClass.max_students) {
        throw new AppError(`Enrollment Blocked: Class has reached its maximum seat capacity of ${targetClass.max_students} students`, 400);
      }

      let enrollmentRecord;
      if (existingEnrollment && existingEnrollment.status === "dropped") {
        // Reactivate previous enrollment record
        enrollmentRecord = await studentClassDAO.updateEnrollmentStatus(studentId, classId, "active", session);
      } else {
        // Create new enrollment record
        enrollmentRecord = await studentClassDAO.enrollStudent({ student_id: studentId, class_id: classId }, session);
      }

      await session.commitTransaction();
      return enrollmentRecord;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Remove a student from a class
  async dropStudentFromClass(studentId, classId) {
    const enrollment = await studentClassDAO.findEnrollment(studentId, classId);
    if (!enrollment || enrollment.status === "dropped") {
      throw new AppError("Active enrollment record not found for this student", 404);
    }

    return await studentClassDAO.updateEnrollmentStatus(studentId, classId, "dropped");
  }

  // Delete a class and all its enrollments
  async deleteClass(classId) {
    const targetClass = await classDAO.findById(classId);
    if (!targetClass) {
      throw new AppError("Class not found", 404);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete all enrollment records for this class
      await studentClassDAO.deleteByClassId(classId, session);

      // Delete the class
      await classDAO.deleteById(classId, session);

      await session.commitTransaction();
      return { message: "Class and all associated enrollment records deleted successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Get timetable for a specific day or all days
  async getTimetable(day = null) {
    let query = { is_active: true };
    
    if (day) {
      query.schedule_days = day;
    }

    const timetableClasses = await classDAO.findTimetable(query);
    
    if (!timetableClasses || timetableClasses.length === 0) {
      return [];
    }

    return timetableClasses;
  }
}

export default new ClassService();