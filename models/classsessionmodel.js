import mongoose from "mongoose";

export function computeSessionStatus(rawStatus, dateVal, endTimeVal) {
  if (rawStatus === "cancelled") return "cancelled";
  if (!dateVal) return rawStatus || "scheduled";

  const sessionDate = new Date(dateVal);
  if (isNaN(sessionDate.getTime())) return rawStatus || "scheduled";

  const now = new Date();
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (sessionDay > today) {
    return "scheduled";
  }
  if (sessionDay < today) {
    return "held";
  }
  
  // Session is today
  if (endTimeVal) {
    const [hours, minutes] = String(endTimeVal).split(":").map(Number);
    if (!isNaN(hours)) {
      const endDateTime = new Date(today);
      endDateTime.setHours(hours, minutes || 0, 0, 0);
      return now >= endDateTime ? "held" : "scheduled";
    }
  }
  return "scheduled";
}

const classSessionSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    teacher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    date: {
      type: String,
      required: true,
    },
    start_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "held", "cancelled"],
      default: "scheduled",
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
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.status = computeSessionStatus(ret.status, ret.date, ret.end_time);
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.status = computeSessionStatus(ret.status, ret.date, ret.end_time);
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate sessions for the same course on the same day
classSessionSchema.index({ course_id: 1, date: 1 }, { unique: true });

classSessionSchema.virtual("session_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("ClassSession", classSessionSchema);
