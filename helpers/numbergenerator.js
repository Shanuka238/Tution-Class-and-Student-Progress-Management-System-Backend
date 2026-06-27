import Student from "../models/studentmodel.js";
import Teacher from "../models/teachermodel.js";

const getYear = () => new Date().getFullYear();
const pad = (num, size = 3) => String(num).padStart(size, "0");

export const generateStudentNumber = async () => {
  const year = getYear();
  const prefix = `STU-${year}-`;

  const lastStudent = await Student.findOne({
    student_number: { $regex: `^${prefix}` },
  })
    .sort({ created_at: -1 })
    .lean();

  let nextNumber = 1;
  if (lastStudent) {
    const lastNum = parseInt(lastStudent.student_number.split("-")[2], 10);
    nextNumber = lastNum + 1;
  }

  return `${prefix}${pad(nextNumber)}`;
};

export const generateTeacherNumber = async () => {
  const year = getYear();
  const prefix = `TCH-${year}-`;

  const lastTeacher = await Teacher.findOne({
    teacher_number: { $regex: `^${prefix}` },
  })
    .sort({ created_at: -1 })
    .lean();

  let nextNumber = 1;
  if (lastTeacher) {
    const lastNum = parseInt(lastTeacher.teacher_number.split("-")[2], 10);
    nextNumber = lastNum + 1;
  }

  return `${prefix}${pad(nextNumber)}`;
};