import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLE_VALUES } from "../enums/userenum.js";


 //Base User Schema
 //Represents user credentials, identity, contact information, and role in the system.

const userSchema = new mongoose.Schema(
  {
    // User's given first name
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    // User's family/last name
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    // Unique login email address
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Hashed password (hidden by default in queries)
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // System authorization role: admin, teacher, student, parent
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: [true, "Role is required"],
    },

    // Sri Lankan contact phone number formatted with +94
    phone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^\+94\d{9}$/.test(v);
        },
        message: (props) =>
          `${props.value} is invalid. Phone number must start with +94 followed by 9 digits (e.g. +94771234567).`,
      },
    },

    // URL to Cloudinary profile avatar
    profile_image: {
      type: String,
      default: "",
    },

    // Status flag indicating whether the account is enabled
    is_active: {
      type: Boolean,
      default: true,
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
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual field to expose string user ID
userSchema.virtual("user_id").get(function () {
  return this._id.toString();
});

// Automatically hash password using Bcrypt before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;