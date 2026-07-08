import mongoose from "mongoose";

import { ATTENDANCE_STATUS_VALUES } from "../enums/attendanceenum.js";

const attendanceSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference link identifier is required"],
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      required: false,
    },
    marked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: [true, "Issuer metadata identity is required"],
    },
    date: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUS_VALUES,
      required: [true, "Attendance status configuration flag is required"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to prevent duplicate marks for a student in a session
attendanceSchema.index({ student_id: 1, session_id: 1 }, { unique: true, sparse: true });

attendanceSchema.virtual("attendance_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Attendance", attendanceSchema);