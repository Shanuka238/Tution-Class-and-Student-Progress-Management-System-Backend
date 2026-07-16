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

    return await examDAO.create(payload);
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
