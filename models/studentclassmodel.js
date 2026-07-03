import mongoose from "mongoose";

const studentClassSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference key is required"],
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference key is required"],
    },
    enrolled_at: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "dropped"],
      default: "active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Enforce unique compound index to prevent duplicate student enrollment records in the same class
studentClassSchema.index({ student_id: 1, class_id: 1 }, { unique: true });

studentClassSchema.virtual("student_class_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("StudentClass", studentClassSchema);