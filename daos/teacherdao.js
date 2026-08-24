import Teacher from "../models/teachermodel.js";


 //Teacher Data Access Object (DAO)
 //Database query interface for teacher profiles and educator sequences.

class TeacherDAO {

  //Create teacher profile within transaction session
  async create(data, session) {
    const [teacher] = await Teacher.create([data], { session });
    return teacher;
  }

  //Find teacher document by base User ID
  async findByUserId(userId) {
    return await Teacher.findOne({ user_id: userId });
  }

  //Update teacher qualifications/subjects by User ID
  async updateByUserId(userId, updateData, session) {
    return await Teacher.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  //Find the most recent teacher number matching prefix (e.g. TCH-2026-)
  async findLastByPrefix(prefix) {
    return await Teacher.findOne({
      teacher_number: { $regex: `^${prefix}` },
    })
      .sort({ created_at: -1 })
      .lean();
  }

  //Delete teacher profile by User ID
  async deleteByUserId(userId, session) {
    return await Teacher.findOneAndDelete({ user_id: userId }, { session });
  }
}

export default new TeacherDAO();