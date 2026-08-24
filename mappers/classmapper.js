import { toTeacherDTO } from "./teachermapper.js";
import { computeSessionStatus } from "../models/classsessionmodel.js";

//Class Data Transfer Object (DTO) Mapper
export const toClassDTO = (cls) => {
  if (!cls) return null;
  const obj = cls.toObject ? cls.toObject() : cls;

  return {
    ...obj,
    _id: obj._id ? obj._id.toString() : obj.id,
    class_id: obj._id ? obj._id.toString() : obj.id, 
  };
};

//Class Session DTO Mapper
export const toClassSessionDTO = (session) => {
  if (!session) return null;
  const obj = session.toObject ? session.toObject() : session;

  return {
    ...obj,
    _id: obj._id ? obj._id.toString() : obj.id,
    session_id: obj._id ? obj._id.toString() : obj.id,
    status: computeSessionStatus(obj.status, obj.date, obj.end_time),
  };
};
