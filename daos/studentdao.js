import Student from "../models/studentmodel.js";

class StudentDAO {
  async create(data, session) {
    const [student] = await Student.create([data], { session });
    return student;
  }

  async findByUserId(userId) {
    return await Student.findOne({ user_id: userId }).populate({
      path: "parent_id",
      populate: { path: "user_id", select: "first_name last_name email phone" },
    });
  }

  async updateByUserId(userId, updateData, session) {
    return await Student.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  async findById(id) {
    return await Student.findById(id).populate("user_id", "first_name last_name email phone profile_image");
  }

  async findStudentsByParentId(parentId) {
    return await Student.find({ parent_id: parentId }).populate("user_id", "first_name last_name email phone profile_image");
  }

  async deleteByUserId(userId, session) {
    return await Student.findOneAndDelete({ user_id: userId }, { session });
  }
}

export default new StudentDAO();