import examDAO from "../daos/examdao.js";
import AppError from "../errors/apperror.js";

class ExamService {
  // Create a new exam record, resolving correct teacher assignments based on role
  async createExam(examPayload, user) {
    if (!examPayload.class_id || !examPayload.exam_title || !examPayload.exam_date || !examPayload.total_marks || !examPayload.term) {
      throw new AppError("Missing required fields for exam creation", 400);
    }
    
    let teacherId;

    if (user.role === "teacher") {
      const teacherDAO = (await import("../daos/teacherdao.js")).default;
      const teacher = await teacherDAO.findByUserId(user._id);
      if (!teacher) {
        throw new AppError("Teacher profile not found", 404);
      }
      teacherId = teacher._id;
    } else if (user.role === "admin") {
      if (examPayload.created_by) {
        teacherId = examPayload.created_by;
      } else {
        const ClassSession = (await import("../models/classsessionmodel.js")).default;
        const session = await ClassSession.findOne({ course_id: examPayload.class_id });
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

    const payload = {
      ...examPayload,
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

      // 1. Notify enrolled class students & parents
      const enrolledStudents = await StudentClass.find({ class_id: examPayload.class_id });
      for (const sc of enrolledStudents) {
        if (sc.student_id) {
          await notificationService.notifyStudentAndParent(sc.student_id, notifData);
        }
      }

      // 2. Also notify all student users in system to guarantee visibility
      const allUsers = await userDAO.findAll();
      const studentUsers = allUsers.filter(
        (u) => u.role && String(u.role).toLowerCase() === "student"
      );
      for (const u of studentUsers) {
        await notificationService.sendSystemNotification(u._id, notifData);
      }
    } catch (notifErr) {
      console.error("Error sending exam creation notifications:", notifErr);
    }

    return newExam;
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
}

export default new ExamService();
