import chatbotService from "../services/chatbotservice.js";

class ChatbotController {
  // Process natural language question using role-scoped context & Gemini AI
  async askQuestion(req, res, next) {
    try {
      const user = req.user;
      const { question } = req.body;

      const result = await chatbotService.processQuestion(user, question);

      return res.status(200).json({
        success: true,
        message: "AI response generated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve user's previous chat log history
  async getHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const history = await chatbotService.getChatHistory(userId);

      return res.status(200).json({
        success: true,
        message: "Chat history retrieved successfully",
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear user's chat log history
  async clearHistory(req, res, next) {
    try {
      const userId = req.user._id;
      await chatbotService.clearChatHistory(userId);

      return res.status(200).json({
        success: true,
        message: "Chat history cleared successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatbotController();
