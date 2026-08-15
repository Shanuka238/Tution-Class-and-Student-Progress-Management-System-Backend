import { toTeacherDTO } from "./teachermapper.js";
import { computeSessionStatus } from "../models/classsessionmodel.js";

export const toClassDTO = (cls) => {
  if (!cls) return null;
  const obj = cls.toObject ? cls.toObject() : cls;

  return {
    ...obj,
    _id: obj._id ? obj._id.toString() : obj.id, // Support aggregate POJOs
    class_id: obj._id ? obj._id.toString() : obj.id, 
  };
};

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
