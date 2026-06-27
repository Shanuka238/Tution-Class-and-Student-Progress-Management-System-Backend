import Student from "../models/studentmodel.js";

class StudentDAO {
  async create(data, session = null) {
    if (session) {
      const [student] = await Student.create([data], { session });
      return student;
    }
    return await Student.create(data);
  }

  async findByUserId(userId) {
    return await Student.findOne({ user_id: userId });
  }

  async findByStudentNumber(studentNumber) {
    return await Student.findOne({ student_number: studentNumber });
  }
}

export default new StudentDAO();