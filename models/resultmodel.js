import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    exam_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    marks_obtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: [0, "Marks cannot be negative"],
    },
    grade: {
      type: String,
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
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

// Ensure a student can only have one result per exam
resultSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

resultSchema.virtual("result_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Result", resultSchema);
