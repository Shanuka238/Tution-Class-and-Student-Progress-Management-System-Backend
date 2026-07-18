import mongoose from "mongoose";
import { FEE_STATUS_VALUES, PAYMENT_METHOD_VALUES } from "../enums/feeenum.js";

const feeSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference is required"],
    },
    month: {
      type: String,
      required: [true, "Month is required (e.g. July 2026)"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      enum: FEE_STATUS_VALUES,
      default: "unpaid",
    },
    due_date: {
      type: Date,
      required: [true, "Due date is required"],
    },
    paid_date: {
      type: Date,
      default: null,
    },
    payment_method: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      default: null,
    },
    payment_id: {
      type: String,
      default: null,
    },
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

feeSchema.virtual("fee_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Fee", feeSchema);
