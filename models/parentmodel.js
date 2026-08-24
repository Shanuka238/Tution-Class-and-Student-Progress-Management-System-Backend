import mongoose from "mongoose";
import { RELATIONSHIP_VALUES } from "../enums/userenum.js";

 //Parent Profile Schema
 //Links to base User account and stores parent/guardian contact details and relationship to children.

const parentSchema = new mongoose.Schema(
  {
    // Reference to User account
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },

    // Parent's occupation/profession
    occupation: {
      type: String,
      trim: true,
      default: "",
    },

    // Residential home address
    address: {
      type: String,
      trim: true,
      default: "",
    },

    // Relationship to student (father, mother, guardian)
    relationship: {
      type: String,
      enum: {
        values: RELATIONSHIP_VALUES,
        message: "Relationship must be father, mother, or guardian",
      },
      required: [true, "Relationship is required"],
    },

    // Emergency phone number
    emergency_contact: {
      type: String,
      trim: true,
      default: "",
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

// Virtual field to expose string parent ID
parentSchema.virtual("parent_id").get(function () {
  return this._id.toString();
});

const Parent = mongoose.model("Parent", parentSchema);

export default Parent;