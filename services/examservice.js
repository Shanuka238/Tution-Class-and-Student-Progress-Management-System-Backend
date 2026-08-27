import examDAO from "../daos/examdao.js";
import AppError from "../errors/apperror.js";

class ExamService {
  // Create a new exam record, resolving correct teacher assignments based on role
  async createExam(examPayload, user) {
    let targetClassId = examPayload.class_id;
    let teacherId;

    if (user.role === "teacher") {
      const teacherDAO = (await import("../daos/teacherdao.js")).default;
      const teacher = await teacherDAO.findByUserId(user._id);
      if (!teacher) {
        throw new AppError("Teacher profile not found", 404);
      }

      const ClassModel = (await import("../models/classmodel.js")).default;
      const classSessionDAO = (await import("../daos/classsessiondao.js")).default;

      // Find all courses assigned to this teacher
      const sessions = await classSessionDAO.findByTeacherId(teacher._id);
      const sessionCourseIds = sessions.map((s) => s.course_id ? (s.course_id._id || s.course_id).toString() : null).filter(Boolean);
      
      const directClasses = await ClassModel.find({
        $or: [
          { teacher_id: teacher._id },
          { teachers: teacher._id }
        ],
        is_active: true
      });
      const directCourseIds = directClasses.map(c => c._id.toString());
      const assignedCourseIds = [...new Set([...sessionCourseIds, ...directCourseIds])];

      if (assignedCourseIds.length === 0) {
        throw new AppError("You are not assigned to any active courses to schedule an exam", 403);
      }

      if (!targetClassId) {
        if (assignedCourseIds.length === 1) {
          targetClassId = assignedCourseIds[0];
        } else {
          throw new AppError("Target class selection is required", 400);
        }
      } else {
        if (!assignedCourseIds.includes(targetClassId.toString())) {
          throw new AppError("Access Denied: You can only schedule exams for courses you are assigned to teach", 403);
        }
      }

      teacherId = teacher._id;
    } else if (user.role === "admin") {
      if (!targetClassId) {
        throw new AppError("Class selection is required", 400);
      }
      if (examPayload.created_by) {
        teacherId = examPayload.created_by;
      } else {
        const ClassSession = (await import("../models/classsessionmodel.js")).default;
        const session = await ClassSession.findOne({ course_id: targetClassId });
        if (session && session.teacher_id) {
          teacherId = session.teacher_id;
        } else {
          const Teacher = (await import("../models/teachermodel.js")).default;
          const fallbackTeacher = await Teacher.findOne();
          if (!fallbackTeacher) {
            throw new AppError("No teachers found in the system to assign to this exam", 404);
          }
          teacherId = fallbackTeacher._id;
        }
      }
    }

    if (!examPayload.exam_title || !examPayload.exam_date || !examPayload.total_marks || !examPayload.term) {
      throw new AppError("Missing required fields for exam creation", 400);
    }

    const payload = {
      ...examPayload,
      class_id: targetClassId,
      created_by: teacherId,
    };

    const newExam = await examDAO.create(payload);

    // Auto-trigger notifications for student users & enrolled students
    try {
      const StudentClass = (await import("../models/studentclassmodel.js")).default;
      const userDAO = (await import("../daos/userdao.js")).default;
      const notificationService = (await import("./notificationservice.js")).default;

      const notifData = {
        title: `New Exam Scheduled: ${newExam.exam_title || newExam.term}`,
        message: `Date: ${new Date(newExam.exam_date).toLocaleDateString()} | Total Marks: ${newExam.total_marks}`,
        type: "result",
      };

      // Notify enrolled class students & parents once
      const enrolledStudents = await StudentClass.find({ class_id: targetClassId, status: "active" });
      const notifiedStudentIds = new Set();
      for (const sc of enrolledStudents) {
        const sId = sc.student_id ? sc.student_id.toString() : null;
        if (sId && !notifiedStudentIds.has(sId)) {
          notifiedStudentIds.add(sId);
          await notificationService.notifyStudentAndParent(sc.student_id, notifData);
        }
      }
    } catch (notifErr) {
      console.error("Error sending exam creation notifications:", notifErr);
    }

    return newExam;
  }

  // Retrieve all exams based on user role and permissions
  async getAllExams(user) {
    if (!user) return [];

    if (user.role === "admin") {
      return await examDAO.findAll();
    }

    if (user.role === "teacher") {
      const teacherDAO = (await import("../daos/teacherdao.js")).default;
      const teacher = await teacherDAO.findByUserId(user._id);
      if (!teacher) return [];
      
      const ClassSession = (await import("../models/classsessionmodel.js")).default;
      const sessions = await ClassSession.find({ teacher_id: teacher._id });
      const sessionCourseIds = sessions.map(s => s.course_id);
      const ClassModel = (await import("../models/classmodel.js")).default;
      const classes = await ClassModel.find({ teacher_id: teacher._id });
      const classIds = [...new Set([...sessionCourseIds.map(String), ...classes.map(c => c._id.toString())])];
      
      return await examDAO.findAll({
        $or: [
          { class_id: { $in: classIds } },
          { created_by: teacher._id }
        ]
      });
    }

    if (user.role === "student") {
      const studentDAO = (await import("../daos/studentdao.js")).default;
      const student = await studentDAO.findByUserId(user._id);
      if (!student) return [];
      
      const StudentClass = (await import("../models/studentclassmodel.js")).default;
      const enrollments = await StudentClass.find({ student_id: student._id, status: "active" });
      const classIds = enrollments.map(e => e.class_id);
      return await examDAO.findAll({ class_id: { $in: classIds } });
    }

    if (user.role === "parent") {
      const parentDAO = (await import("../daos/parentdao.js")).default;
      const parent = await parentDAO.findByUserId(user._id);
      if (!parent) return [];
      
      const studentDAO = (await import("../daos/studentdao.js")).default;
      const children = await studentDAO.findStudentsByParentId(parent._id);
      const childIds = children.map(c => c._id);
      const StudentClass = (await import("../models/studentclassmodel.js")).default;
      const enrollments = await StudentClass.find({ student_id: { $in: childIds }, status: "active" });
      const classIds = enrollments.map(e => e.class_id);
      return await examDAO.findAll({ class_id: { $in: classIds } });
    }

    return await examDAO.findAll();
  }

  // Retrieve all exams associated with a class
  async getExamsByClass(classId) {
    if (!classId) {
      throw new AppError("Class ID is required", 400);
    }
    return await examDAO.findByClassId(classId);
  }

  // Fetch detailed information for a single exam by ID
  async getExamById(examId) {
    if (!examId) {
      throw new AppError("Exam ID is required", 400);
    }
    return await examDAO.findById(examId);
  }

  // Update exam details (only exam_title, exam_date, start_time, and end_time can be modified)
  async updateExam(examId, updatePayload, user) {
    if (!examId) {
      throw new AppError("Exam ID is required", 400);
    }

    const exam = await examDAO.findById(examId);
    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    // Permission check for teachers
    if (user.role === "teacher") {
      const teacherDAO = (await import("../daos/parentdao.js")).default; // import teacher dao
      const TeacherDAO = (await import("../daos/teacherdao.js")).default;
      const teacher = await TeacherDAO.findByUserId(user._id);
      if (!teacher) {
        throw new AppError("Teacher profile not found", 404);
      }

      const isCreator = exam.created_by && String(exam.created_by._id || exam.created_by) === String(teacher._id);
      const isClassTeacher = exam.class_id && String(exam.class_id.teacher_id) === String(teacher._id);
      const isMultiTeacher = exam.class_id?.teachers && exam.class_id.teachers.some(t => String(t) === String(teacher._id));

      if (!isCreator && !isClassTeacher && !isMultiTeacher) {
        throw new AppError("Access Denied: You can only edit exams for courses you are assigned to teach", 403);
      }
    }

    // Restrict updates exclusively to exam name, date, and time
    const safeUpdateData = {};
    if (updatePayload.exam_title !== undefined && updatePayload.exam_title.trim() !== "") {
      safeUpdateData.exam_title = updatePayload.exam_title.trim();
    }
    if (updatePayload.exam_date !== undefined) {
      const parsedDate = new Date(updatePayload.exam_date);
      if (isNaN(parsedDate.getTime())) {
        throw new AppError("Invalid exam date format provided", 400);
      }
      safeUpdateData.exam_date = parsedDate;
    }
    if (updatePayload.start_time !== undefined) {
      safeUpdateData.start_time = updatePayload.start_time;
    }
    if (updatePayload.end_time !== undefined) {
      safeUpdateData.end_time = updatePayload.end_time;
    }

    if (Object.keys(safeUpdateData).length === 0) {
      throw new AppError("No valid fields provided for exam update (allowed: exam_title, exam_date, start_time, end_time)", 400);
    }

    const updatedExam = await examDAO.updateById(examId, safeUpdateData);
    return updatedExam;
  }

  // Delete exam and associated results
  async deleteExam(examId, user) {
    if (!examId) {
      throw new AppError("Exam ID is required", 400);
    }

    const exam = await examDAO.findById(examId);
    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    // Permission check for teachers
    if (user.role === "teacher") {
      const TeacherDAO = (await import("../daos/teacherdao.js")).default;
      const teacher = await TeacherDAO.findByUserId(user._id);
      if (!teacher) {
        throw new AppError("Teacher profile not found", 404);
      }

      const isCreator = exam.created_by && String(exam.created_by._id || exam.created_by) === String(teacher._id);
      const isClassTeacher = exam.class_id && String(exam.class_id.teacher_id) === String(teacher._id);
      const isMultiTeacher = exam.class_id?.teachers && exam.class_id.teachers.some(t => String(t) === String(teacher._id));

      if (!isCreator && !isClassTeacher && !isMultiTeacher) {
        throw new AppError("Access Denied: You can only delete exams for courses you are assigned to teach", 403);
      }
    }

    // Delete associated student results first
    const resultDAO = (await import("../daos/resultdao.js")).default;
    await resultDAO.deleteByExamId(examId);

    // Delete exam record
    await examDAO.deleteById(examId);

    return { message: "Exam and associated results deleted successfully" };
  }
}

export default new ExamService();

