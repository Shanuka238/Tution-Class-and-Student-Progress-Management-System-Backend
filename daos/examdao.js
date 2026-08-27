import Exam from "../models/exammodel.js";


 //Examination Data Access Object (DAO)
 //Database query interface for assessment structures and exam lookup.
class ExamDAO {

  // Insert new Exam document
  async create(examData) {
    const exam = await Exam.create(examData);
    return exam;
  }

  //Find exam by ID with populated class and creator details
  async findById(examId) {
    return await Exam.findById(examId).populate("class_id created_by");
  }
   
   //Find all exams created for a specific class ID
  async findByClassId(classId) {
    return await Exam.find({ class_id: classId }).populate("class_id created_by").sort({ exam_date: -1 });
  }

  
   //Find all exams matching filter
  async findAll(filter = {}) {
    return await Exam.find(filter).populate("class_id created_by").sort({ exam_date: -1 });
  }

  
  //Update exam by ID
  async updateById(examId, updateData) {
    return await Exam.findByIdAndUpdate(
      examId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("class_id created_by");
  }

  //Delete exam by ID
  async deleteById(examId) {
    return await Exam.findByIdAndDelete(examId);
  }
}

export default new ExamDAO();

