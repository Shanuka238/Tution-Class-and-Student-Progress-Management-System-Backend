import AppError from "../errors/apperror.js";
import { USER_ROLES } from "../enums/userenum.js";


//Validate Admin-specific profile fields
export const validateAdminFields = (data) => {
  return true;
};


//Validate Parent-specific profile fields (relationship types)
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


//Validate Student-specific profile fields (parent link, DOB, grade)
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


//Validate Teacher-specific profile fields (qualifications, subjects)
export const validateTeacherFields = (data) => {
  const { subjects, qualifications } = data;

  if (!qualifications) {
    throw new AppError("Qualifications are required", 400);
  }

  if (!subjects) {
    throw new AppError("Subjects are required", 400);
  }

  return true;
};


//Dispatches profile validation based on user role
export const validateRoleFields = (role, data) => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return validateAdminFields(data);
    case USER_ROLES.TEACHER:
      return validateTeacherFields(data);
    case USER_ROLES.STUDENT:
      return validateStudentFields(data);
    case USER_ROLES.PARENT:
      return validateParentFields(data);
    default:
      throw new AppError(`Unknown role: ${role}`, 400);
  }
};

export const validateByRole = validateRoleFields;