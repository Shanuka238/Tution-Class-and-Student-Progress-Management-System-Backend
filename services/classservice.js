import mongoose from "mongoose";
import classDAO from "../daos/classdao.js";
import studentClassDAO from "../daos/studentclassdao.js";
import classSessionDAO from "../daos/classsessiondao.js";
import studentDAO from "../daos/studentdao.js";
import Fee from "../models/feemodel.js";
import Attendance from "../models/attendancemodel.js";
import { FEE_STATUS } from "../enums/feeenum.js";
import AppError from "../errors/apperror.js";


class ClassService {
  // Create a new class
  async createClass(classPayload) {
    const payload = { ...classPayload };
    if (payload.teacher_ids && Array.isArray(payload.teacher_ids) && payload.teacher_ids.length > 0) {
      payload.teachers = payload.teacher_ids;
      payload.teacher_id = payload.teacher_ids[0];
    } else if (payload.teacher_id) {
      payload.teachers = [payload.teacher_id];
    }
    // Save class to database
    return await classDAO.create(payload);
  }

  // Fetch all active classes (optionally filtered for teachers)
  async getActiveClasses(user = null) {
    let classes = await classDAO.findAllActive();
    if (user && user.role === "teacher") {
      const teacherDAO = (await import("../daos/teacherdao.js")).default;
      const teacher = await teacherDAO.findByUserId(user._id);
      if (teacher) {
        const teacherIdStr = teacher._id.toString();
        const classSessionDAO = (await import("../daos/classsessiondao.js")).default;
        const sessions = await classSessionDAO.findByTeacherId(teacher._id);
        const sessionCourseIds = sessions.map((s) => s.course_id ? s.course_id.toString() : null).filter(Boolean);
        
        classes = classes.filter((c) => {
          const directTeacherId = c.teacher_id?._id || c.teacher_id;
          const isDirectTeacher = directTeacherId && directTeacherId.toString() === teacherIdStr;
          const isDirectTeachersArray = Array.isArray(c.teachers) && c.teachers.some(t => (t._id || t).toString() === teacherIdStr);
          const hasSession = sessionCourseIds.includes(c._id.toString());
          return isDirectTeacher || isDirectTeachersArray || hasSession;
        });
      } else {
        classes = [];
      }
    }
    return classes;
  }

  // Fetch a student's enrolled classes
  async getMyClasses(userId) {
    const student = await studentDAO.findByUserId(userId);
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }
    return await studentClassDAO.findClassesByStudent(student._id);
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

      // Automatically assign existing class monthly fee bills to this newly enrolled student
      const existingClassFees = await Fee.find({ class_id: classId });
      const billingMonths = {};
      existingClassFees.forEach(fee => {
        if (!billingMonths[fee.month]) {
          billingMonths[fee.month] = {
            amount: fee.amount,
            due_date: fee.due_date
          };
        }
      });

      for (const [month, info] of Object.entries(billingMonths)) {
        const studentHasFee = await Fee.findOne({
          student_id: studentId,
          class_id: classId,
          month: month
        });

        if (!studentHasFee) {
          await Fee.create([{
            student_id: studentId,
            class_id: classId,
            month: month,
            amount: info.amount,
            due_date: info.due_date,
            status: FEE_STATUS.UNPAID
          }], { session });
        }
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

  // Get timetable for a specific date range, filtered by user role
  async getTimetable(startDate, endDate, user) {
    let query = {};

    if (user && user.role === "teacher") {
      const teacherDAO = (await import("../daos/teacherdao.js")).default;
      const teacher = await teacherDAO.findByUserId(user._id);
      if (teacher) {
        const ClassModel = (await import("../models/classmodel.js")).default;
        const teacherClasses = await ClassModel.find({
          $or: [{ teacher_id: teacher._id }, { teachers: teacher._id }]
        });
        const teacherCourseIds = teacherClasses.map(c => c._id);
        
        query.$or = [
          { teacher_id: teacher._id },
          { course_id: { $in: teacherCourseIds } }
        ];
      }
    } else if (user && user.role === "student") {
      const studentDAO = (await import("../daos/studentdao.js")).default;
      const student = await studentDAO.findByUserId(user._id);
      if (student) {
        const enrollments = await studentClassDAO.findStudentsByClass
          ? await studentClassDAO.findClassesByStudent(student._id)
          : [];
        const courseIds = enrollments.map(e => e.class_id?._id || e.class_id);
        query.course_id = { $in: courseIds };
      }
    } else if (user && user.role === "parent") {
      const parentDAO = (await import("../daos/parentdao.js")).default;
      const studentDAO = (await import("../daos/studentdao.js")).default;
      const parent = await parentDAO.findByUserId(user._id);
      if (parent) {
        const children = await studentDAO.findStudentsByParentId(parent._id);
        const childIds = children.map(c => c._id);
        const allEnrollments = [];
        for (const childId of childIds) {
          const childClasses = await studentClassDAO.findClassesByStudent(childId);
          allEnrollments.push(...childClasses);
        }
        const courseIds = allEnrollments.map(e => e.class_id?._id || e.class_id);
        query.course_id = { $in: courseIds };
      }
    }

    const timetableSessions = await classSessionDAO.findTimetableSessions(query);
    
    // Filter active courses only
    let activeSessions = timetableSessions.filter(session => session.course_id != null);

    // Filter by date range accurately handling both Date and String formats
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      activeSessions = activeSessions.filter(session => {
        if (!session.date) return false;
        const sessionDate = new Date(session.date);
        return !isNaN(sessionDate.getTime()) && sessionDate >= start && sessionDate <= end;
      });
    }

    return activeSessions;
  }
}

export default new ClassService();