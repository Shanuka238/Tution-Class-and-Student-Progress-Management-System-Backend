import AppError from "../errors/apperror.js";
import { PAYMENT_METHOD_VALUES } from "../enums/feeenum.js";

//Tuition Fee and Invoicing Validator
class FeeValidator {

  //Validate class monthly billing generation input
  validateGenerateMonthlyFeesInput(data) {
    const { class_id, month, amount, due_date } = data;

    if (!class_id || !month || !amount || !due_date) {
      throw new AppError("Missing required parameters for fee generation (class_id, month, amount, due_date)", 400);
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new AppError("Billing amount must be a positive numeric value", 400);
    }

    const parsedDate = new Date(due_date);
    if (isNaN(parsedDate.getTime())) {
      throw new AppError("Invalid due date format provided", 400);
    }

    return true;
  }

  //Validate payment settlement method
  validateMarkAsPaidInput(data) {
    const { payment_method } = data;
    if (payment_method && !PAYMENT_METHOD_VALUES.includes(payment_method)) {
      throw new AppError(`Invalid payment method. Supported options: ${PAYMENT_METHOD_VALUES.join(", ")}`, 400);
    }
    return true;
  }
}

export default new FeeValidator();
