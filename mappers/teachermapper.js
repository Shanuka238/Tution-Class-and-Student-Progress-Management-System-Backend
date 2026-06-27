import { toUserDTO } from "./usermapper.js";

export const toTeacherDTO = (teacher, user = null) => {
  if (!teacher) return null;
  const obj = teacher.toObject ? teacher.toObject() : teacher;

  return {
    teacher_id: obj._id.toString(),
    user_id: obj.user_id.toString(),
    teacher_number: obj.teacher_number,
    subjects: obj.subjects,
    qualifications: obj.qualifications,
    created_at: obj.created_at,
    ...(user && { user: toUserDTO(user) }),
  };
};