import ChatLog from "../models/chatlogmodel.js";

 //AI Chat Log Data Access Object (DAO)
 //Database query interface for saving and retrieving conversational interactions with Gemini AI.
class ChatLogDAO {

   // Record a new question and response chat entry
  async createLog(data) {
    return await ChatLog.create(data);
  }

   //Retrieve conversation history for a user
  async getHistoryByUserId(userId, limit = 30) {
    return await ChatLog.find({ user_id: userId })
      .sort({ created_at: 1 })
      .limit(limit);
  }

   //Clear all chat history for a user
  async clearHistoryByUserId(userId) {
    return await ChatLog.deleteMany({ user_id: userId });
  }
}

export default new ChatLogDAO();
