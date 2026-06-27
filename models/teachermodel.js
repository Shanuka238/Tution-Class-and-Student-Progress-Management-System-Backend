import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    teacher_number: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    subjects: {
      type: String,
      required: [true, "Subjects are required"],
      trim: true,
    },
    qualifications: {
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

// Virtual field for teacher_id
teacherSchema.virtual("teacher_id").get(function () {
  return this._id.toString();
});

// Auto-generate teacher_number before validation
teacherSchema.pre("validate", async function () {
  if (this.teacher_number) return;

  const year = new Date().getFullYear();
  const count = await mongoose.model("Teacher").countDocuments({
    teacher_number: new RegExp(`^TCH-${year}-`),
  });

  const sequence = String(count + 1).padStart(3, "0");
  this.teacher_number = `TCH-${year}-${sequence}`;
});

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;