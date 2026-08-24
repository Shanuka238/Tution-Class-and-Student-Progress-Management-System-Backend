import mongoose from "mongoose";
import { ENROLLMENT_STATUS, ENROLLMENT_STATUS_VALUES } from "../enums/studentclassenum.js";

 //Student Class Enrollment Association Schema
 //Manages many-to-many enrollment mapping between Students and Classes.

const studentClassSchema = new mongoose.Schema(
  {
    // Reference to enrolled Student
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference key is required"],
    },

    // Reference to target Class / Course
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference key is required"],
    },

    // Date when enrollment was confirmed
    enrolled_at: {
      type: Date,
      default: Date.now,
    },

    // Enrollment status: active, dropped, completed
    status: {
      type: String,
      enum: ENROLLMENT_STATUS_VALUES,
      default: ENROLLMENT_STATUS.ACTIVE,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Enforce unique compound index to prevent duplicate enrollments for the same student in a class
studentClassSchema.index({ student_id: 1, class_id: 1 }, { unique: true });

// Virtual field to expose string enrollment ID
studentClassSchema.virtual("student_class_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("StudentClass", studentClassSchema);