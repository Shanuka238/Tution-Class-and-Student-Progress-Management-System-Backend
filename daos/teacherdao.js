import Teacher from "../models/teachermodel.js";

class TeacherDAO {
  async create(data, session = null) {
    if (session) {
      const [teacher] = await Teacher.create([data], { session });
      return teacher;
    }
    return await Teacher.create(data);
  }

  async findByUserId(userId) {
    return await Teacher.findOne({ user_id: userId });
  }

  async findByTeacherNumber(teacherNumber) {
    return await Teacher.findOne({ teacher_number: teacherNumber });
  }
}

export default new TeacherDAO();