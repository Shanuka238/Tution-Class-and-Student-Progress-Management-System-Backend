import mongoose from "mongoose";
import { SESSION_STATUS, SESSION_STATUS_VALUES } from "../enums/classsessionenum.js";

export function computeSessionStatus(rawStatus, dateVal, endTimeVal) {
  if (rawStatus === SESSION_STATUS.CANCELLED) return SESSION_STATUS.CANCELLED;
  if (!dateVal) return rawStatus || SESSION_STATUS.SCHEDULED;

  const sessionDate = new Date(dateVal);
  if (isNaN(sessionDate.getTime())) return rawStatus || SESSION_STATUS.SCHEDULED;

  const now = new Date();
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (sessionDay > today) {
    return SESSION_STATUS.SCHEDULED;
  }
  if (sessionDay < today) {
    return SESSION_STATUS.HELD;
  }
  
  // Session is today
  if (endTimeVal) {
    const [hours, minutes] = String(endTimeVal).split(":").map(Number);
    if (!isNaN(hours)) {
      const endDateTime = new Date(today);
      endDateTime.setHours(hours, minutes || 0, 0, 0);
      return now >= endDateTime ? SESSION_STATUS.HELD : SESSION_STATUS.SCHEDULED;
    }
  }
  return SESSION_STATUS.SCHEDULED;
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
      enum: SESSION_STATUS_VALUES,
      default: SESSION_STATUS.SCHEDULED,
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

// Indexes for optimized query performance
classSessionSchema.index({ course_id: 1, date: 1 });
classSessionSchema.index({ teacher_id: 1, date: 1 });

classSessionSchema.virtual("session_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("ClassSession", classSessionSchema);
