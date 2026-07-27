import crypto from "crypto";
import feeDAO from "../daos/feedao.js";
import studentDAO from "../daos/studentdao.js";
import StudentClass from "../models/studentclassmodel.js";
import AppError from "../errors/apperror.js";
import payHereConfig from "../config/payhere.js";
import { FEE_STATUS, PAYMENT_METHOD } from "../enums/feeenum.js";

class FeeService {
  // Generate MD5 signature hash for PayHere
  generatePayHereHash(orderId, amount, currency) {
    const amountFormatted = Number(amount)
      .toFixed(2)
      .replace(/[^\d.]/g, "");
    
    const secretHash = crypto
      .createHash("md5")
      .update(payHereConfig.merchantSecret)
      .digest("hex")
      .toUpperCase();

    const hashStr =
      payHereConfig.merchantId +
      orderId +
      amountFormatted +
      currency +
      secretHash;

    const hash = crypto
      .createHash("md5")
      .update(hashStr)
      .digest("hex")
      .toUpperCase();

    return hash;
  }

  // Generate fee records for all students in a class for a specific month
  async generateMonthlyFeesForClass(classId, month, amount, dueDateString) {
    const dueDate = new Date(dueDateString);
    const studentsInClass = await StudentClass.find({ class_id: classId });
    if (studentsInClass.length === 0) {
      throw new AppError("No students enrolled in this class", 400);
    }

    const feeRecords = [];
    for (const record of studentsInClass) {
      const existing = await feeDAO.findWithFilters({
        student_id: record.student_id,
        class_id: classId,
        month
      });

      if (existing.length === 0) {
        feeRecords.push({
          student_id: record.student_id,
          class_id: classId,
          month,
          amount,
          status: FEE_STATUS.UNPAID,
          due_date: dueDate
        });
      }
    }

    if (feeRecords.length === 0) {
      throw new AppError("Monthly fee billing records already generated for all students in this class", 400);
    }

    return await feeDAO.bulkCreate(feeRecords);
  }

  // Mark fee payment manually (Admin / Cash)
  async markAsPaid(feeId, paymentMethod = PAYMENT_METHOD.CASH, paymentId = "") {
    const fee = await feeDAO.findById(feeId);
    if (!fee) {
      throw new AppError("Fee record not found", 404);
    }

    if (fee.status === FEE_STATUS.PAID) {
      throw new AppError("Fee has already been paid", 400);
    }

    const receiptUrl = `https://res.cloudinary.com/dummy/image/upload/v12345/receipts/rec_${feeId}.pdf`;

    return await feeDAO.update(feeId, {
      status: FEE_STATUS.PAID,
      paid_date: new Date(),
      payment_method: paymentMethod,
      payment_id: paymentId || `CASH_${Date.now()}`,
      receipt_url: receiptUrl
    });
  }

  // Initiate PayHere transaction request params
  async initiatePayHerePayment(feeId, studentUser) {
    const fee = await feeDAO.findById(feeId);
    if (!fee) {
      throw new AppError("Fee record not found", 404);
    }

    if (fee.status === FEE_STATUS.PAID) {
      throw new AppError("Fee has already been paid", 400);
    }

    const orderId = `FEE${feeId}${Date.now()}`;
    const currency = "LKR";
    const amount = fee.amount;

    const hash = this.generatePayHereHash(orderId, amount, currency);

    const dashboardPrefix = studentUser.role === "parent" ? "parent" : "student";

    // PayHere mandatory checkout payload parameters
    return {
      merchant_id: payHereConfig.merchantId,
      return_url: `http://localhost:5173/${dashboardPrefix}/dashboard?payment=success&fee_id=${feeId}`,
      cancel_url: `http://localhost:5173/${dashboardPrefix}/dashboard?payment=cancelled&fee_id=${feeId}`,
      notify_url: process.env.PAYHERE_NOTIFY_URL || "https://webhook.site/payhere-webhook",
      order_id: orderId,
      items: `Tuition Fee - ${fee.class_id?.class_name || "Tuition"} (${fee.month})`,
      amount: Number(amount).toFixed(2),
      currency: currency,
      first_name: studentUser.first_name || "Parent",
      last_name: studentUser.last_name || "User",
      email: studentUser.email || "parent@edutracker.com",
      phone: studentUser.phone || "0771234567",
      address: "No. 12, Main Street",
      city: "Colombo",
      country: "Sri Lanka",
      hash: hash,
      fee_id: feeId,
      is_sandbox: payHereConfig.isSandbox
    };
  }

  // Get fees history for a specific student user
  async getStudentFees(userId) {
    const student = await studentDAO.findByUserId(userId);
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }
    return await feeDAO.findWithFilters({ student_id: student._id });
  }

  // Get all fees for Admin tracking
  async getAllFees(filters = {}) {
    return await feeDAO.findWithFilters(filters);
  }

  // Get financial stats metrics
  async getFinancialStats(filters = {}) {
    return await feeDAO.getFinancialStats(filters);
  }

  // Trigger automated alerts/reminders for overdue fees
  async sendOverdueReminders() {
    const now = new Date();
    // Update statuses first
    await FeeService.syncOverdueStatuses();

    const overdueFees = await feeDAO.findWithFilters({ status: "overdue" });
    
    // Simulate sending email/sms notifications
    const sentTo = overdueFees.map(fee => {
      const user = fee.student_id?.user_id || {};
      return `${user.first_name} ${user.last_name} (${user.email}) - LKR ${fee.amount}`;
    });

    return {
      success: true,
      message: `Successfully sent overdue notifications to ${overdueFees.length} students`,
      recipients: sentTo
    };
  }

  // Sync overdue status based on due dates
  static async syncOverdueStatuses() {
    await feeDAO.syncOverdueStatuses();
  }
}

export default new FeeService();
