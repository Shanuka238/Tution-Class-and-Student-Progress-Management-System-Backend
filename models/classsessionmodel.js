import mongoose from "mongoose";
import { SESSION_STATUS, SESSION_STATUS_VALUES } from "../enums/classsessionenum.js";


 //Dynamically computes whether a session is scheduled or held based on calendar date and end time
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
  
  // Session is scheduled for today - check end time
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

/**
 * Class Session Schema
 * Represents an individual class timetable slot on a specific date with venue and educator.
 */
const classSessionSchema = new mongoose.Schema(
  {
    // Parent course/class reference
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    // Assigned educator teaching this specific session
    teacher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    // Session date formatted as YYYY-MM-DD
    date: {
      type: String,
      required: true,
    },

    // Start time in 24-hour format (e.g. 08:30)
    start_time: {
      type: String,
      required: true,
    },

    // End time in 24-hour format (e.g. 10:30)
    end_time: {
      type: String,
      required: true,
    },

    // Physical hall, classroom, or lab venue
    venue: {
      type: String,
      required: true,
      trim: true,
    },

    // Session operational status: scheduled, held, cancelled
    status: {
      type: String,
      enum: SESSION_STATUS_VALUES,
      default: SESSION_STATUS.SCHEDULED,
    },

    // Optional session notes or topic summary
    notes: {
      type: String,
      trim: true,
    },

    // Administrator or user who scheduled this session
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

// Indexes for query performance
classSessionSchema.index({ course_id: 1, date: 1 });
classSessionSchema.index({ teacher_id: 1, date: 1 });

classSessionSchema.virtual("session_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("ClassSession", classSessionSchema);
