import mongoose from "mongoose";
import classDAO from "../daos/classdao.js";
import studentClassDAO from "../daos/studentclassdao.js";
import AppError from "../errors/apperror.js";
import ClassSession from "../models/classsessionmodel.js";
import Attendance from "../models/attendancemodel.js";

class ClassService {
  // Create a new class
  async createClass(classPayload) {
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

  // Delete a class and all its enrollments, sessions and session attendance records
  async deleteClass(classId) {
    const targetClass = await classDAO.findById(classId);
    if (!targetClass) {
      throw new AppError("Class not found", 404);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Delete all enrollment records for this class
      await studentClassDAO.deleteByClassId(classId, session);

      // 2. Find all sessions of this course and delete their attendance
      const sessions = await ClassSession.find({ course_id: classId });
      const sessionIds = sessions.map(s => s._id);
      if (sessionIds.length > 0) {
        await Attendance.deleteMany({ session_id: { $in: sessionIds } }, { session });
        await ClassSession.deleteMany({ _id: { $in: sessionIds } }, { session });
      }

      // 3. Delete the class itself
      await classDAO.deleteById(classId, session);

      await session.commitTransaction();
      return { message: "Class and all associated enrollment, session, and attendance records deleted successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Get timetable for a specific date range
  async getTimetable(startDate, endDate) {
    let query = {};
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      // Default to from today onwards if no dates provided
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    const timetableSessions = await ClassSession.find(query)
      .populate({
        path: "course_id",
        match: { is_active: true },
        populate: { 
          path: "teacher_id", 
          populate: { path: "user_id", select: "first_name last_name" } 
        }
      })
      .sort({ date: 1, start_time: 1 });
    
    // Filter out sessions where the course is inactive (course_id will be null due to match)
    const activeSessions = timetableSessions.filter(session => session.course_id != null);

    return activeSessions;
  }
}

export default new ClassService();