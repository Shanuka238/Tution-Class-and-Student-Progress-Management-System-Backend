import express from "express";
import feeController from "../controllers/feecontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/webhook", feeController.handlePayHereWebhook);

router.use(protect);

router.get("/me", authorize("student"), feeController.getMyFees);
router.post("/:id/initiate-payhere", authorize("student"), feeController.initiatePayHere);
router.post("/:id/mock-payhere-success", authorize("student"), feeController.mockPayHereSuccess);

router.post("/", authorize("admin"), feeController.generateMonthlyFees);
router.get("/", authorize("admin"), feeController.getAllFees);
router.get("/stats", authorize("admin"), feeController.getFinancialStats);
router.post("/:id/pay-cash", authorize("admin"), feeController.markAsPaid);
router.post("/remind-overdue", authorize("admin"), feeController.sendOverdueReminders);

export default router;
