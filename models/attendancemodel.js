import mongoose from "mongoose";
import { ATTENDANCE_STATUS_VALUES } from "../enums/attendanceenum.js";


 //Attendance Record Schema
 //Tracks student presence (present, absent, late) for a specific class session.

const attendanceSchema = new mongoose.Schema(
  {
    // Reference to student whose attendance is recorded
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference link identifier is required"],
    },

    // Reference to Class / Course
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
    },

    // Reference to specific timetable ClassSession
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      required: false,
    },

    // Teacher or Admin user who marked this attendance record
    marked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: [true, "Issuer metadata identity is required"],
    },

    // Calendar date of the attendance mark
    date: {
      type: Date,
      required: false,
    },

    // Attendance status: present, absent, late
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

// Compound unique index to prevent duplicate marks for a student in the same session
attendanceSchema.index({ student_id: 1, session_id: 1 }, { unique: true, sparse: true });

// Virtual field to expose string attendance ID
attendanceSchema.virtual("attendance_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Attendance", attendanceSchema);