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
}

export default new AdminDAO();