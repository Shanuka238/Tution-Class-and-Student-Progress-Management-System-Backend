import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

const payHereConfig = {
  merchantId: process.env.PAYHERE_MERCHANT_ID || "1211149",
  merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || "4Mmzg4MDk5NDM4Nzc2MTEyODk2Mjg1NzQ0MTA1MTE4OTk0",
  isSandbox: process.env.PAYHERE_IS_SANDBOX !== "false",
};

export default payHereConfig;
