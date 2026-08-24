import mongoose from "mongoose";

 //Admin Profile Schema
 //Links to base User account and tracks administrative privileges and session activity.

const adminSchema = new mongoose.Schema(
  {
    // Reference to User account
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },

    // Timestamp of the administrator's most recent login session
    last_login: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual field to expose string admin ID
adminSchema.virtual("admin_id").get(function () {
  return this._id.toString();
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;