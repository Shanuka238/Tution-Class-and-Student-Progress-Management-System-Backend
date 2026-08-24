import express from "express";
import chatbotController from "../controllers/chatbotcontroller.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Require user authentication for AI Chatbot interactions
router.use(protect);

// Gemini AI Chatbot Endpoints
router.post("/ask", chatbotController.askQuestion);
router.get("/history", chatbotController.getHistory);
router.delete("/history", chatbotController.clearHistory);

export default router;
