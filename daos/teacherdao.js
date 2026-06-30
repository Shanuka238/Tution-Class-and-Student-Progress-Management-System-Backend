import Teacher from "../models/teachermodel.js";

class TeacherDAO {
  async create(data, session) {
    const [teacher] = await Teacher.create([data], { session });
    return teacher;
  }

  async findByUserId(userId) {
    return await Teacher.findOne({ user_id: userId });
  }

  async updateByUserId(userId, updateData, session) {
    return await Teacher.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  async deleteByUserId(userId, session) {
    return await Teacher.findOneAndDelete({ user_id: userId }, { session });
  }
}

export default new TeacherDAO();