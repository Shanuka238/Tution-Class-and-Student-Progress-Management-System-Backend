import Parent from "../models/parentmodel.js";

class ParentDAO {
  async create(data, session) {
    const [parent] = await Parent.create([data], { session });
    return parent;
  }

  async findById(id) {
    return await Parent.findById(id).populate("user_id", "first_name last_name email phone profile_image");
  }

  async findByUserId(userId) {
    return await Parent.findOne({ user_id: userId }).populate("user_id", "first_name last_name email phone profile_image");
  }

  async findAll() {
    return await Parent.find().populate("user_id", "first_name last_name email phone profile_image");
  }

  async updateByUserId(userId, updateData, session) {
    return await Parent.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  async deleteByUserId(userId, session) {
    return await Parent.findOneAndDelete({ user_id: userId }, { session });
  }
}

export default new ParentDAO();