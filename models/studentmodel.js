import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },
    student_number: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    date_of_birth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    grade: {
      type: String,
      required: [true, "Grade is required"],
      trim: true,
    },
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

// Virtual field for student_id
studentSchema.virtual("student_id").get(function () {
  return this._id.toString();
});

// Auto-generate student_number before validation
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