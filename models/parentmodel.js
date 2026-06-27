import mongoose from "mongoose";
import { RELATIONSHIP_VALUES } from "../enums/userenum.js";

const parentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    occupation: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    relationship: {
      type: String,
      enum: {
        values: RELATIONSHIP_VALUES,
        message: "Relationship must be father, mother, or guardian",
      },
      required: [true, "Relationship is required"],
    },
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

// Virtual field for parent_id
parentSchema.virtual("parent_id").get(function () {
  return this._id.toString();
});

const Parent = mongoose.model("Parent", parentSchema);

export default Parent;