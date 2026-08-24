import Parent from "../models/parentmodel.js";

 //Parent Data Access Object (DAO)
 //Database query interface for parent/guardian profile records.
class ParentDAO {
   //Create parent profile within transaction session
  async create(data, session) {
    const [parent] = await Parent.create([data], { session });
    return parent;
  }
  
  //Find parent by MongoDB ID with populated user account details
  async findById(id) {
    return await Parent.findById(id).populate("user_id", "first_name last_name email phone profile_image");
  }

  //Find parent by base User ID with populated user details
  async findByUserId(userId) {
    return await Parent.findOne({ user_id: userId }).populate("user_id", "first_name last_name email phone profile_image");
  }

  //Find all parent profiles in system
  async findAll() {
    return await Parent.find().populate("user_id", "first_name last_name email phone profile_image");
  }

  //Update parent profile by User ID
  async updateByUserId(userId, updateData, session) {
    return await Parent.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  //Delete parent profile by User ID
  async deleteByUserId(userId, session) {
    return await Parent.findOneAndDelete({ user_id: userId }, { session });
  }
}

export default new ParentDAO();