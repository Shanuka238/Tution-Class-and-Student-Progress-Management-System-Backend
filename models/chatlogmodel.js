import mongoose from "mongoose";

const chatLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    user_role: {
      type: String,
      required: true,
      enum: ["admin", "teacher", "student", "parent"],
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const ChatLog = mongoose.model("ChatLog", chatLogSchema);

export default ChatLog;
