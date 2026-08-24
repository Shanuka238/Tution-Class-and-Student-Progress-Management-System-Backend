import mongoose from "mongoose";
import { EXAM_TERM_VALUES } from "../enums/examenum.js";


 //Exam Schema
 //Represents an academic examination, test, or assessment created for a specific class.
const examSchema = new mongoose.Schema(
  {
    // Class/Course for which this exam is scheduled
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    // Teacher profile who created this assessment
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    // Title or name of the examination (e.g. Mid-Term Assessment 2026)
    exam_title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },

    // Date when the exam is conducted
    exam_date: {
      type: Date,
      required: [true, "Exam date is required"],
    },

    // Total maximum obtainable marks (e.g. 100)
    total_marks: {
      type: Number,
      required: [true, "Total marks are required"],
      min: [1, "Total marks must be greater than 0"],
    },

    // Academic term: 1st Term, 2nd Term, 3rd Term, Mid-Term, Monthly Test
    term: {
      type: String,
      enum: EXAM_TERM_VALUES,
      required: true,
    },

    // Optional stringified JSON array of exam sections / question breakdown
    sections: {
      type: String,
      default: "[]",
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to expose string exam ID
examSchema.virtual("exam_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Exam", examSchema);
