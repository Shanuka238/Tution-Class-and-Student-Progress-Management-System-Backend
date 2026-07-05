import mongoose from "mongoose";

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
      required: [true, "Class reference link identifier is required"],
    },
    marked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Can trace to the User/Teacher profile record who submitted the data
      required: [true, "Issuer metadata identity is required"],
    },
    date: {
      type: Date,
      required: [true, "Attendance tracking calendar date target is required"],
    },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: [true, "Attendance status configuration flag is required"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Enforce a compound index to prevent duplicate marks for a single student in a class on the same day
attendanceSchema.index({ student_id: 1, class_id: 1, date: 1 }, { unique: true });

attendanceSchema.virtual("attendance_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Attendance", attendanceSchema);