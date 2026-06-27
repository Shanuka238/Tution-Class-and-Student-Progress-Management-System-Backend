import User from "../models/usermodel.js";

class UserDAO {
  async create(userData) {
    return await User.create(userData);
  }

  // ✨ NEW: For transactions
  async createWithSession(userData, session) {
    const [user] = await User.create([userData], { session });
    return user;
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() }).select("+password");
  }

  async findById(id) {
    return await User.findById(id);
  }

  async existsByEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }
}

export default new UserDAO();