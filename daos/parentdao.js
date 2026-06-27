import Parent from "../models/parentmodel.js";

class ParentDAO {
  async create(data, session = null) {
    if (session) {
      const [parent] = await Parent.create([data], { session });
      return parent;
    }
    return await Parent.create(data);
  }

  async findByUserId(userId) {
    return await Parent.findOne({ user_id: userId });
  }

  async findById(id) {
    return await Parent.findById(id);
  }
}

export default new ParentDAO();