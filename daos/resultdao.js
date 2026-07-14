import Result from "../models/resultmodel.js";

class ResultDAO {
  async bulkUpsert(resultsData) {
    const operations = resultsData.map((result) => ({
      updateOne: {
        filter: { exam_id: result.exam_id, student_id: result.student_id },
        update: { $set: result },
        upsert: true,
      },
    }));

    return await Result.bulkWrite(operations);
  }

  async findByExamId(examId) {
    return await Result.find({ exam_id: examId })
      .populate({
        path: "student_id",
        select: "student_number user_id",
        populate: {
          path: "user_id",
          select: "first_name last_name email",
        },
      })
      .sort({ rank: 1 });
  }

  async findByStudentId(studentId) {
    return await Result.find({ student_id: studentId })
      .populate({
        path: "exam_id",
        populate: {
          path: "class_id",
          select: "class_name subject grade",
        },
      })
      .sort({ created_at: -1 });
  }
}

export default new ResultDAO();
