import mongoose from "mongoose";

 //Exam Result Schema
 //Stores individual student exam marks, letter grades, class ranks, and teacher remarks.

const resultSchema = new mongoose.Schema(
  {
    // Reference to target Exam
    exam_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    // Reference to assessed Student
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Score obtained by the student
    marks_obtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: [0, "Marks cannot be negative"],
    },

    // Standardized letter grade (A, B, C, S, F)
    grade: {
      type: String,
      required: true,
    },

    // Student's relative rank within the class
    rank: {
      type: Number,
      required: true,
    },

    // Feedback or teacher remarks
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure a student can only have one unique result per exam
resultSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

// Virtual field to expose string result ID
resultSchema.virtual("result_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Result", resultSchema);
