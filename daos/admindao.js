import Admin from "../models/adminmodel.js";

class AdminDAO {
  async create(data, session = null) {
    if (session) {
      const [admin] = await Admin.create([data], { session });
      return admin;
    }
    return await Admin.create(data);
  }

  async findByUserId(userId) {
    return await Admin.findOne({ user_id: userId });
  }

  async updateLastLogin(userId) {
    return await Admin.findOneAndUpdate(
      { user_id: userId },
      { last_login: new Date() },
      { new: true }
    );
  }

  async updateByUserId(userId, updateData, session = null) {
    const options = { new: true };
    if (session) options.session = session;
    return await Admin.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      options
    );
  }

  async deleteByUserId(userId, session = null) {
    const options = {};
    if (session) options.session = session;
    return await Admin.findOneAndDelete({ user_id: userId }, options);
  }
}

export default new AdminDAO();