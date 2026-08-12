import express from "express";
import chatbotController from "../controllers/chatbotcontroller.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/ask", chatbotController.askQuestion);
router.get("/history", chatbotController.getHistory);
router.delete("/history", chatbotController.clearHistory);

export default router;
