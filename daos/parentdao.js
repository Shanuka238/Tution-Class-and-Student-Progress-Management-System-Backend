import Parent from "../models/parentmodel.js";

class ParentDAO {
  async create(data, session) {
    const [parent] = await Parent.create([data], { session });
    return parent;
  }

  async findByUserId(userId) {
    return await Parent.findOne({ user_id: userId });
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