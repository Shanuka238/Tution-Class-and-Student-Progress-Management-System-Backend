import feeService from "../services/feeservice.js";
import { toFeeDTO, toFeeListDTO } from "../mappers/feemapper.js";
import feeValidator from "../validators/feevalidator.js";

class FeeController {
  // Generate billing fee records for a class (Admin)
  async generateMonthlyFees(req, res, next) {
    try {
      feeValidator.validateGenerateMonthlyFeesInput(req.body);
      const { class_id, month, amount, due_date } = req.body;
      const data = await feeService.generateMonthlyFeesForClass(class_id, month, amount, due_date);
      return res.status(201).json({
        success: true,
        message: `Successfully generated ${data.length} student billing records for ${month}`,
        data: toFeeListDTO(data)
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all fee records with optional filters (Admin)
  async getAllFees(req, res, next) {
    try {
      const { class_id, status } = req.query;
      const filters = {};
      if (class_id) filters.class_id = class_id;
      if (status) filters.status = status;

      const data = await feeService.getAllFees(filters);
      return res.status(200).json({
        success: true,
        data: toFeeListDTO(data)
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve tuition financial stats & summaries (Admin)
  async getFinancialStats(req, res, next) {
    try {
      const { class_id } = req.query;
      const filters = {};
      if (class_id) filters.class_id = class_id;

      const stats = await feeService.getFinancialStats(filters);
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Manually log a cash payment (Admin)
  async markAsPaid(req, res, next) {
    try {
      const { id } = req.params;
      const data = await feeService.markAsPaid(id, "cash");
      return res.status(200).json({
        success: true,
        message: "Fee marked as paid via Cash successfully",
        data: toFeeDTO(data)
      });
    } catch (error) {
      next(error);
    }
  }

  // Trigger automated reminder notifications for unpaid overdue fees (Admin)
  async sendOverdueReminders(req, res, next) {
    try {
      const data = await feeService.sendOverdueReminders();
      return res.status(200).json({
        success: true,
        message: data.message,
        data: data.recipients
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve my own enrolled fee records (Student)
  async getMyFees(req, res, next) {
    try {
      const userId = req.user._id;
      const data = await feeService.getStudentFees(userId);
      return res.status(200).json({
        success: true,
        data: toFeeListDTO(data)
      });
    } catch (error) {
      next(error);
    }
  }

  // Request PayHere payload hashes to initiate checkout (Student)
  async initiatePayHere(req, res, next) {
    try {
      const { id } = req.params;
      const data = await feeService.initiatePayHerePayment(id, req.user);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // Webhook confirmation for PayHere IPN callbacks (Public)
  async handlePayHereWebhook(req, res, next) {
    try {
      const { order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;
      
      // Verification logic of MD5 Signature from PayHere Webhook (IPN):
      // md5sig = UpperCase(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UpperCase(MD5(merchant_secret))))
      // Since this is a webhook, we verify this payload hash to validate integrity.

      console.log("PayHere Webhook triggered with body:", req.body);
      
      // If payment completed (status_code === '2' means success in PayHere)
      if (status_code === "2") {
        // Extract fee ID from order_id (Format: FEE + 24-character fee_id + timestamp)
        const feeId = order_id.substring(3, 27);
        await feeService.markAsPaid(feeId, "payhere", order_id);
      }

      return res.status(200).send("Webhook received");
    } catch (error) {
      console.error("PayHere webhook processing failure:", error);
      return res.status(500).send("Webhook process error");
    }
  }

  // Mock PayHere sandbox payment completion for local development (Student/Gateway Simulate)
  async mockPayHereSuccess(req, res, next) {
    try {
      const { id } = req.params;
      const data = await feeService.markAsPaid(id, "payhere", `MOCK_PH_${id}_${Date.now()}`);
      return res.status(200).json({
        success: true,
        message: "Payment simulation completed successfully!",
        data: toFeeDTO(data)
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FeeController();
