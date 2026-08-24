import mongoose from "mongoose";

 //Student Profile Schema
 //Links to base User account and stores academic grade, parent reference, and student number.

const studentSchema = new mongoose.Schema(
  {
    // Reference to User account (authentication & credentials)
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },

    // Reference to linked Parent profile
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },

    // Unique academic registration number (e.g. STU-2026-001)
    student_number: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Student's date of birth
    date_of_birth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    // Current academic grade or year level (e.g. Grade 10)
    grade: {
      type: String,
      required: [true, "Grade is required"],
      trim: true,
    },

    // Residential mailing address
    address: {
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

// Virtual field to expose string student ID
studentSchema.virtual("student_id").get(function () {
  return this._id.toString();
});

// Automatically generate formatted student number (e.g. STU-2026-001) before validation
studentSchema.pre("validate", async function () {
  if (this.student_number) return;

  const year = new Date().getFullYear();
  const count = await mongoose.model("Student").countDocuments({
    student_number: new RegExp(`^STU-${year}-`),
  });

  const sequence = String(count + 1).padStart(3, "0");
  this.student_number = `STU-${year}-${sequence}`;
});

const Student = mongoose.model("Student", studentSchema);

export default Student;