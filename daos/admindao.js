import Admin from "../models/adminmodel.js";

 //Admin Data Access Object (DAO)
 //Database query interface for administrator profile records.
class AdminDAO {
  
   //Create admin profile
  async create(data, session = null) {
    if (session) {
      const [admin] = await Admin.create([data], { session });
      return admin;
    }
    return await Admin.create(data);
  }

   //Find admin profile by base User ID
  async findByUserId(userId) {
    return await Admin.findOne({ user_id: userId });
  }

   //Record updated login timestamp for admin
  async updateLastLogin(userId) {
    return await Admin.findOneAndUpdate(
      { user_id: userId },
      { last_login: new Date() },
      { new: true }
    );
  }

   //Update admin profile by User ID
  async updateByUserId(userId, updateData, session = null) {
    const options = { new: true };
    if (session) options.session = session;
    return await Admin.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      options
    );
  }


   //Delete admin profile by User ID
  async deleteByUserId(userId, session = null) {
    const options = {};
    if (session) options.session = session;
    return await Admin.findOneAndDelete({ user_id: userId }, options);
  }
}

export default new AdminDAO();