import mongoose from "mongoose";
import { FEE_STATUS_VALUES, PAYMENT_METHOD_VALUES } from "../enums/feeenum.js";


 //Tuition Fee Invoice Schema
 //Manages monthly tuition billing, payment status (paid, unpaid, overdue), and PayHere transaction metadata.
const feeSchema = new mongoose.Schema(
  {
    // Reference to student being billed
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },

    // Reference to Class/Course for which fee is charged
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference is required"],
    },

    // Billing month (e.g. August 2026)
    month: {
      type: String,
      required: [true, "Month is required (e.g. July 2026)"],
    },

    // Fee amount in Sri Lankan Rupees (LKR)
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    // Payment status: unpaid, paid, overdue
    status: {
      type: String,
      enum: FEE_STATUS_VALUES,
      default: "unpaid",
    },

    // Payment deadline due date
    due_date: {
      type: Date,
      required: [true, "Due date is required"],
    },

    // Date when payment was successfully processed
    paid_date: {
      type: Date,
      default: null,
    },

    // Payment channel used: cash, payhere, bank_transfer
    payment_method: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      default: null,
    },

    // Unique payment gateway transaction ID or cash receipt reference
    payment_id: {
      type: String,
      default: null,
    },

    // Digital PDF receipt URL
    receipt_url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to expose string fee ID
feeSchema.virtual("fee_id").get(function () {
  return this._id.toString();
});

const Fee = mongoose.model("Fee", feeSchema);

export default Fee;
