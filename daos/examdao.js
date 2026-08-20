import Exam from "../models/exammodel.js";

class ExamDAO {
  async create(examData) {
    const exam = await Exam.create(examData);
    return exam;
  }

  async findById(examId) {
    return await Exam.findById(examId).populate("class_id created_by");
  }

  async findByClassId(classId) {
    return await Exam.find({ class_id: classId }).populate("class_id created_by").sort({ exam_date: -1 });
  }

  async findAll(filter = {}) {
    return await Exam.find(filter).populate("class_id created_by").sort({ exam_date: -1 });
  }

  async deleteById(examId) {
    return await Exam.findByIdAndDelete(examId);
  }
}

export default new ExamDAO();
