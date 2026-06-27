import AppError from "../errors/apperror.js";
import { USER_ROLES } from "../enums/userenum.js";

export const validateAdminFields = (data) => {
  // Admin has no extra required fields beyond base User
  return true;
};

export const validateParentFields = (data) => {
  const { relationship } = data;

  if (!relationship) {
    throw new AppError("Parent relationship is required", 400);
  }

  const allowed = ["father", "mother", "guardian"];
  if (!allowed.includes(relationship)) {
    throw new AppError(
      "Relationship must be 'father', 'mother', or 'guardian'",
      400
    );
  }

  return true;
};

export const validateStudentFields = (data) => {
  const { parent_id, date_of_birth, grade } = data;

  if (!parent_id) {
    throw new AppError("parent_id is required for student registration", 400);
  }

  if (!date_of_birth) {
    throw new AppError("Date of birth is required", 400);
  }

  const dob = new Date(date_of_birth);
  if (isNaN(dob.getTime())) {
    throw new AppError("Invalid date of birth format", 400);
  }

  if (dob >= new Date()) {
    throw new AppError("Date of birth must be in the past", 400);
  }

  if (!grade) {
    throw new AppError("Grade is required", 400);
  }

  return true;
};

export const validateTeacherFields = (data) => {
  const { subjects, qualifications } = data;

  if (!qualifications) {
    throw new AppError("Qualifications are required", 400);
  }

  if (!subjects || (Array.isArray(subjects) && subjects.length === 0)) {
    throw new AppError("At least one subject is required", 400);
  }

  return true;
};

export const validateByRole = (role, data) => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return validateAdminFields(data);
    case USER_ROLES.PARENT:
      return validateParentFields(data);
    case USER_ROLES.STUDENT:
      return validateStudentFields(data);
    case USER_ROLES.TEACHER:
      return validateTeacherFields(data);
    default:
      throw new AppError("Invalid role for validation", 400);
  }
};