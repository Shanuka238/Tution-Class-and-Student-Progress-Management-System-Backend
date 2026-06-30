import Student from "../models/studentmodel.js";

class StudentDAO {
  async create(data, session) {
    const [student] = await Student.create([data], { session });
    return student;
  }

  async findByUserId(userId) {
    return await Student.findOne({ user_id: userId });
  }

  async updateByUserId(userId, updateData, session) {
    return await Student.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  async deleteByUserId(userId, session) {
    return await Student.findOneAndDelete({ user_id: userId }, { session });
  }
}

export default new StudentDAO();