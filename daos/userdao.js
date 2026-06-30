import User from "../models/usermodel.js";

class UserDAO {
  async create(userData) {
    return await User.create(userData);
  }

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

  async findAll() {
    return await User.find().sort({ created_at: -1 });
  }

  async findByIdWithSession(id, session) {
    return await User.findById(id).session(session);
  }

  async updateWithSession(id, updateData, session) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  async softDeleteWithSession(id, session) {
    return await User.findByIdAndUpdate(
      id,
      { $set: { is_active: false } },
      { new: true, session }
    );
  }

  async hardDeleteWithSession(id, session) {
    return await User.findByIdAndDelete(id, { session });
  }
}

export default new UserDAO();