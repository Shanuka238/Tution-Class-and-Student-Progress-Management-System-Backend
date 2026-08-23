import crypto from "crypto";
import feeDAO from "../daos/feedao.js";
import studentDAO from "../daos/studentdao.js";
import studentClassDAO from "../daos/studentclassdao.js";
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
    const studentsInClass = await studentClassDAO.findStudentsByClass(classId, "active");
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

    const createdFees = await feeDAO.bulkCreate(feeRecords);

    // Trigger tuition fee alerts for students & parents
    try {
      const notificationService = (await import("./notificationservice.js")).default;
      for (const feeRec of createdFees) {
        await notificationService.notifyStudentAndParent(feeRec.student_id, {
          title: `Tuition Fee Issued (${month})`,
          message: `New tuition fee invoice of LKR ${(amount || 0).toLocaleString()} issued for ${month}. Due date: ${new Date(dueDate).toLocaleDateString()}`,
          type: "fee",
        });
      }
    } catch (notifErr) {
      console.error("Error triggering fee notifications:", notifErr);
    }

    return createdFees;
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

    const updatedFee = await feeDAO.update(feeId, {
      status: FEE_STATUS.PAID,
      paid_date: new Date(),
      payment_method: paymentMethod,
      payment_id: paymentId || `CASH_${Date.now()}`,
      receipt_url: receiptUrl
    });

    // Auto-trigger payment confirmation notification
    try {
      const notificationService = (await import("./notificationservice.js")).default;
      const studentDoc = await studentDAO.findById(fee.student_id);
      if (studentDoc && studentDoc.user_id) {
        await notificationService.sendSystemNotification(studentDoc.user_id, {
          title: "Payment Confirmed & Verified",
          message: `Your payment of LKR ${(fee.amount || 0).toLocaleString()} for ${fee.month} has been recorded successfully.`,
          type: "fee",
        });
      }
    } catch (notifErr) {
      console.error("Error sending payment confirmation notification:", notifErr);
    }

    return updatedFee;
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
    await feeDAO.syncOverdueStatuses();
    const student = await studentDAO.findByUserId(userId);
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }
    return await feeDAO.findWithFilters({ student_id: student._id });
  }

  // Get all fees for Admin tracking
  async getAllFees(filters = {}) {
    await feeDAO.syncOverdueStatuses();
    return await feeDAO.findWithFilters(filters);
  }

  // Get financial stats metrics
  async getFinancialStats(filters = {}) {
    await feeDAO.syncOverdueStatuses();
    return await feeDAO.getFinancialStats(filters);
  }

  // Trigger automated alerts/reminders for overdue fees
  async sendOverdueReminders() {
    await feeDAO.syncOverdueStatuses();
    const overdueFees = await feeDAO.findWithFilters({ status: "overdue" });

    try {
      const notificationService = (await import("./notificationservice.js")).default;
      for (const fee of overdueFees) {
        const studentId = fee.student_id?._id || fee.student_id;
        if (studentId) {
          await notificationService.notifyStudentAndParent(studentId, {
            title: `Payment Overdue Warning ⚠️ (${fee.month || "Tuition"})`,
            message: `Tuition fee payment of LKR ${(fee.amount || 0).toLocaleString()} for ${fee.month} is OVERDUE. Due date was ${new Date(fee.due_date).toLocaleDateString()}. Please complete payment.`,
            type: "fee",
          });
        }
      }
    } catch (notifErr) {
      console.error("Error dispatching overdue fee notifications:", notifErr);
    }

    return {
      success: true,
      message: `Successfully dispatched real-time overdue notifications to ${overdueFees.length} students & parents`,
      count: overdueFees.length
    };
  }

  // Automatically sync and dispatch overdue fee alert notifications for a parent or student user
  async syncOverdueFeeAlertsForUser(user) {
    if (!user) return;
    await feeDAO.syncOverdueStatuses();

    try {
      const studentDAO = (await import("../daos/studentdao.js")).default;
      const parentDAO = (await import("../daos/parentdao.js")).default;
      const notificationService = (await import("./notificationservice.js")).default;
      const Notification = (await import("../models/notificationmodel.js")).default;

      let studentIds = [];
      if (user.role === "student") {
        const student = await studentDAO.findByUserId(user._id);
        if (student) studentIds.push(student._id);
      } else if (user.role === "parent") {
        const parent = await parentDAO.findByUserId(user._id);
        if (parent) {
          const children = await studentDAO.findStudentsByParentId(parent._id);
          studentIds = children.map(c => c._id);
        }
      }

      if (studentIds.length === 0) return;

      const overdueFees = await feeDAO.findWithFilters({
        student_id: { $in: studentIds },
        status: "overdue"
      });

      for (const fee of overdueFees) {
        const feeMonth = fee.month || "Tuition Fee";
        // Check if an unread fee alert for this specific month already exists for this user
        const existingAlert = await Notification.findOne({
          receiver_user_id: user._id,
          notification_type: "fee",
          notification_title: { $regex: feeMonth, $options: "i" },
          is_read: false
        });

        if (!existingAlert) {
          const studentId = fee.student_id?._id || fee.student_id;
          await notificationService.notifyStudentAndParent(studentId, {
            title: `Payment Overdue Warning ⚠️ (${feeMonth})`,
            message: `Tuition fee payment of LKR ${(fee.amount || 0).toLocaleString()} for ${feeMonth} is OVERDUE. Due date was ${new Date(fee.due_date).toLocaleDateString()}. Please settle online or via bank transfer.`,
            type: "fee",
          });
        }
      }
    } catch (err) {
      console.error("Error in syncOverdueFeeAlertsForUser:", err);
    }
  }

  // Sync overdue status based on due dates
  static async syncOverdueStatuses() {
    await feeDAO.syncOverdueStatuses();
  }
}

export default new FeeService();
