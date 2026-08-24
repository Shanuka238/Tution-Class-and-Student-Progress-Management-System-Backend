import { toClassDTO } from "./classmapper.js";
import { toStudentDTO } from "./studentmapper.js";

//Exam DTO Mapper
export const toExamDTO = (exam) => {
  if (!exam) return null;
  const obj = exam.toObject ? exam.toObject() : exam;

  return {
    ...obj,
    _id: obj._id ? obj._id.toString() : obj.id,
    exam_id: obj._id ? obj._id.toString() : obj.id,
    class_id: typeof obj.class_id === "object" ? toClassDTO(obj.class_id) : obj.class_id,
  };
};

//Exam Result DTO Mapper
export const toResultDTO = (result) => {
  if (!result) return null;
  const obj = result.toObject ? result.toObject() : result;

  return {
    ...obj,
    _id: obj._id ? obj._id.toString() : obj.id,
    result_id: obj._id ? obj._id.toString() : obj.id,
    exam_id: typeof obj.exam_id === "object" ? toExamDTO(obj.exam_id) : obj.exam_id,
    student_id: typeof obj.student_id === "object" ? toStudentDTO(obj.student_id, obj.student_id.user_id) : obj.student_id,
  };
};
