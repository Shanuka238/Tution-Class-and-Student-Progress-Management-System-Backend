//Fee Invoicing and Payment Method Enums
export const FEE_STATUS = {
  PAID: "paid",
  UNPAID: "unpaid",
  OVERDUE: "overdue",
};

export const FEE_STATUS_VALUES = Object.values(FEE_STATUS);

// Supported payment processing methods
export const PAYMENT_METHOD = {
  CASH: "cash",
  PAYHERE: "payhere",
  STRIPE: "stripe",
};

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);
