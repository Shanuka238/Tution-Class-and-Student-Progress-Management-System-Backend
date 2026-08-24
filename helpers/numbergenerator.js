import studentDAO from "../daos/studentdao.js";
import teacherDAO from "../daos/teacherdao.js";

const getYear = () => new Date().getFullYear();
const pad = (num, size = 3) => String(num).padStart(size, "0");

/**
 * Generates sequential student registration number (e.g. STU-2026-001)
 */
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

/**
 * Generates sequential teacher registration number (e.g. TCH-2026-001)
 */
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