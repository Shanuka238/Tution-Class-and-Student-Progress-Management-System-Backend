import ChatLog from "../models/chatlogmodel.js";

class ChatLogDAO {
  async createLog(data) {
    return await ChatLog.create(data);
  }

  async getHistoryByUserId(userId, limit = 30) {
    return await ChatLog.find({ user_id: userId })
      .sort({ created_at: 1 })
      .limit(limit);
  }

  async clearHistoryByUserId(userId) {
    return await ChatLog.deleteMany({ user_id: userId });
  }
}

export default new ChatLogDAO();
