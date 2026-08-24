import User from "../models/usermodel.js";

 //User Data Access Object (DAO)
 //Direct database access layer for User collection queries and mutations.
class UserDAO {

  //Insert new User document
  async create(userData) {
    return await User.create(userData);
  }

  //Insert new User within a transactional MongoDB session
  async createWithSession(userData, session) {
    const [user] = await User.create([userData], { session });
    return user;
  }

  //Find user by email including hashed password field for login authentication
  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() }).select("+password");
  }

  //Find user document by ID
  async findById(id) {
    return await User.findById(id);
  }

  //Find user document by ID including hashed password field
  async findByIdWithPassword(id) {
    return await User.findById(id).select("+password");
  }

  //Check if email address is already taken
  async existsByEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  //Retrieve all users sorted by creation timestamp
  async findAll() {
    return await User.find().sort({ created_at: -1 });
  }

  //Find user by ID using an active MongoDB transaction session
  async findByIdWithSession(id, session) {
    return await User.findById(id).session(session);
  }

  //Update user document by ID
  async update(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  //Update user document within transaction session
  async updateWithSession(id, updateData, session) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  //Soft-delete user by setting is_active to false
  async softDeleteWithSession(id, session) {
    return await User.findByIdAndUpdate(
      id,
      { $set: { is_active: false } },
      { new: true, session }
    );
  }

  //Hard-delete user document from database
  async hardDeleteWithSession(id, session) {
    return await User.findByIdAndDelete(id).session(session);
  }
}

export default new UserDAO();