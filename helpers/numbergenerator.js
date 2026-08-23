import studentDAO from "../daos/studentdao.js";
import teacherDAO from "../daos/teacherdao.js";

const getYear = () => new Date().getFullYear();
const pad = (num, size = 3) => String(num).padStart(size, "0");

export const generateStudentNumber = async () => {
  const year = getYear();
  const prefix = `STU-${year}-`;

  const lastStudent = await studentDAO.findLastByPrefix(prefix);

  let nextNumber = 1;
  if (lastStudent && lastStudent.student_number) {
    const lastNum = parseInt(lastStudent.student_number.split("-")[2], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${pad(nextNumber)}`;
};

export const generateTeacherNumber = async () => {
  const year = getYear();
  const prefix = `TCH-${year}-`;

  const lastTeacher = await teacherDAO.findLastByPrefix(prefix);

  let nextNumber = 1;
  if (lastTeacher && lastTeacher.teacher_number) {
    const lastNum = parseInt(lastTeacher.teacher_number.split("-")[2], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${pad(nextNumber)}`;
};