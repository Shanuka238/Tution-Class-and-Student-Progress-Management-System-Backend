import Result from "../models/resultmodel.js";


 //Exam Results Data Access Object (DAO)
 //Database operations for exam marks, ranks, and student academic performance records.
class ResultDAO {
  //Upsert a batch of student exam results
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

  //Find all student results for a specific exam ID sorted by rank
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
      .populate({
        path: "exam_id",
        populate: {
          path: "class_id",
          select: "class_name subject grade",
        },
      })
      .sort({ rank: 1 });
  }

  //Find all exam results for a specific student ID
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
