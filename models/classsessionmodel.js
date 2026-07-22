import mongoose from "mongoose";

const classSessionSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Course reference is required"],
    },
    teacher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "A session must be assigned to an educator"],
    },
    date: {
      type: Date,
      required: [true, "Session date is required"],
    },
    start_time: {
      type: String,
      required: [true, "Start time is required"],
    },
    end_time: {
      type: String,
      required: [true, "End time is required"],
    },
    venue: {
      type: String,
      required: [true, "Class session venue is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["held", "cancelled"],
      default: "held",
    },
    notes: {
      type: String,
      trim: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate sessions for the same course on the same day
classSessionSchema.index({ course_id: 1, date: 1 }, { unique: true });

classSessionSchema.virtual("session_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("ClassSession", classSessionSchema);
