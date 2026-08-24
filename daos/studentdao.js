import Student from "../models/studentmodel.js";

 //Student Data Access Object (DAO)
 //Handles Student collection queries, parent relationships, and sequential registration prefixes.
class StudentDAO {
  //Create student profile in transaction session
  async create(data, session) {
    const [student] = await Student.create([data], { session });
    return student;
  }

  //Find student profile by base User ID with populated parent details
  async findByUserId(userId) {
    return await Student.findOne({ user_id: userId }).populate({
      path: "parent_id",
      populate: { path: "user_id", select: "first_name last_name email phone" },
    });
  }

  //Update student profile fields by User ID
  async updateByUserId(userId, updateData, session) {
    return await Student.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  //Find student profile by MongoDB document ID
  async findById(id) {
    return await Student.findById(id).populate("user_id", "first_name last_name email phone profile_image");
  }
  //Find all student children linked to a parent ID
  async findStudentsByParentId(parentId) {
    return await Student.find({ parent_id: parentId }).populate("user_id", "first_name last_name email phone profile_image");
  }
  //Find the most recent student number matching a prefix (e.g. STU-2026-)
  async findLastByPrefix(prefix) {
    return await Student.findOne({
      student_number: { $regex: `^${prefix}` },
    })
      .sort({ created_at: -1 })
      .lean();
  }

  //Delete student profile by User ID
  async deleteByUserId(userId, session) {
    return await Student.findOneAndDelete({ user_id: userId }, { session });
  }
}

export default new StudentDAO();