import mongoose from "mongoose";

//Class / Course Schema
//Stores tuition class details, assigned teachers, subject, academic grade, and capacity limits.

const classSchema = new mongoose.Schema(
  {
    // Course or batch name (e.g. O/L Mathematics 2026 Batch A)
    class_name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
    },

    // Subject taught in this class (e.g. Mathematics, Science)
    subject: {
      type: String,
      required: [true, "Subject parameter is required"],
      trim: true,
    },

    // Target academic grade level (e.g. Grade 10, Grade 11)
    grade: {
      type: String,
      required: [true, "Grade parameter is required"],
      trim: true,
    },

    // Course term commencement date
    start_date: {
      type: Date,
      required: [true, "Class start date is required"],
    },

    // Course term conclusion date
    end_date: {
      type: Date,
      required: [true, "Class end date is required"],
    },

    // Maximum enrolled student capacity
    max_students: {
      type: Number,
      required: [true, "Maximum student capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },

    // Primary lead teacher assigned to the class
    teacher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    // Array of all co-teachers / educators assigned to this course
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],

    // Active status flag for class operations
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to expose string class ID
classSchema.virtual("class_id").get(function () {
  return this._id.toString();
});

export default mongoose.model("Class", classSchema);