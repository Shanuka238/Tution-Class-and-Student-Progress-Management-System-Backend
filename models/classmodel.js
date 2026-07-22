import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    class_name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject parameter is required"],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, "Grade parameter is required"],
      trim: true,
    },

    start_date: {
      type: Date,
      required: [true, "Class start date is required"],
    },
    end_date: {
      type: Date,
      required: [true, "Class end date is required"],
    },
    max_students: {
      type: Number,
      required: [true, "Maximum student capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

classSchema.virtual("class_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Class", classSchema);