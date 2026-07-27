import parentDAO from "../daos/parentdao.js";
import studentDAO from "../daos/studentdao.js";
import studentClassDAO from "../daos/studentclassdao.js";
import attendanceDAO from "../daos/attendancedao.js";
import feeDAO from "../daos/feedao.js";
import resultDAO from "../daos/resultdao.js";
import ClassSession from "../models/classsessionmodel.js";
import AppError from "../errors/apperror.js";

class ParentService {
  // Retrieve all children linked to a parent's user_id
  async getMyChildren(parentUserId) {
    const parent = await parentDAO.findByUserId(parentUserId);
    if (!parent) {
      throw new AppError("Parent profile not found", 404);
    }

    const children = await studentDAO.findStudentsByParentId(parent._id);
    return children.map((student) => {
      const obj = student.toObject ? student.toObject() : student;
      return {
        ...obj,
        student_id: obj._id ? obj._id.toString() : obj.id,
      };
    });
  }

  // Retrieve comprehensive academic progress for a specific child
  async getChildProgress(parentUserId, studentId) {
    const parent = await parentDAO.findByUserId(parentUserId);
    if (!parent) {
      throw new AppError("Parent profile not found", 404);
    }

    const student = await studentDAO.findById(studentId);
    if (!student) {
      throw new AppError("Student record not found", 404);
    }

    // Verify foreign key relationship
    if (
      !student.parent_id ||
      student.parent_id.toString() !== parent._id.toString()
    ) {
      throw new AppError(
        "Access denied: You are not authorized to view this student's academic progress",
        403
      );
    }

    // Fetch child's academic records in parallel
    const [enrollments, attendance, fees, results] = await Promise.all([
      studentClassDAO.findClassesByStudent(student._id),
      attendanceDAO.findByStudentId(student._id),
      feeDAO.findWithFilters({ student_id: student._id }),
      resultDAO.findByStudentId(student._id),
    ]);

    const enrolledClasses = enrollments
      .map((e) => e.class_id)
      .filter((c) => c != null);

    // Fetch timetable sessions for enrolled classes
    const courseIds = enrolledClasses.map((c) => c._id);
    let timetableSessions = [];
    if (courseIds.length > 0) {
      timetableSessions = await ClassSession.find({
        course_id: { $in: courseIds },
      })
        .populate({
          path: "course_id",
          select: "class_name subject grade",
        })
        .populate({
          path: "teacher_id",
          populate: { path: "user_id", select: "first_name last_name" },
        })
        .sort({ date: 1, start_time: 1 });
    }

    return {
      student: {
        student_id: student._id.toString(),
        student_number: student.student_number,
        grade: student.grade,
        date_of_birth: student.date_of_birth,
        user: student.user_id,
      },
      classes: enrolledClasses,
      attendance: attendance,
      fees: fees,
      results: results,
      timetable: timetableSessions,
    };
  }
}

export default new ParentService();
