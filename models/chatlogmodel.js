import mongoose from "mongoose";

//AI Chatbot Conversation Log Schema
//Stores historical queries and Gemini AI responses for student, parent, teacher, and admin users.

const chatLogSchema = new mongoose.Schema(
  {
    // User who initiated the chatbot conversation
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Role of user during interaction
    user_role: {
      type: String,
      required: true,
      enum: ["admin", "teacher", "student", "parent"],
    },

    // User's natural language question / prompt
    question: {
      type: String,
      required: true,
      trim: true,
    },

    // AI generated response content
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
