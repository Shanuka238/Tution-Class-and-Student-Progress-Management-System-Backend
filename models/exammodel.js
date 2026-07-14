import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    exam_title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },
    exam_date: {
      type: Date,
      required: [true, "Exam date is required"],
    },
    total_marks: {
      type: Number,
      required: [true, "Total marks are required"],
      min: [1, "Total marks must be greater than 0"],
    },
    term: {
      type: String,
      enum: ["Term 1", "Term 2", "Term 3"],
      required: true,
    },
    sections: {
      type: String,
      default: "[]", // Store stringified JSON array
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

examSchema.virtual("exam_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Exam", examSchema);
