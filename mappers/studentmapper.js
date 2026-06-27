import { toUserDTO } from "./usermapper.js";

export const toStudentDTO = (student, user = null) => {
  if (!student) return null;
  const obj = student.toObject ? student.toObject() : student;

  return {
    student_id: obj._id.toString(),
    user_id: obj.user_id.toString(),
    parent_id: obj.parent_id.toString(),
    student_number: obj.student_number,
    date_of_birth: obj.date_of_birth,
    grade: obj.grade,
    address: obj.address,
    created_at: obj.created_at,
    ...(user && { user: toUserDTO(user) }),
  };
};