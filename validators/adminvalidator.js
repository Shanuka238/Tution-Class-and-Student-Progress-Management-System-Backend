import AppError from "../errors/apperror.js";
import { ROLE_VALUES, RELATIONSHIP_VALUES } from "../enums/userenum.js";

class AdminValidator {
  validateCreateUserInput(data) {
    const { first_name, last_name, email, password, role } = data;

    if (!first_name || !last_name || !email || !password || !role) {
      throw new AppError("Missing core required identity fields", 400);
    }

    if (!ROLE_VALUES.includes(role)) {
      throw new AppError("Invalid role value specified", 400);
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Invalid email address format", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    this._validateRoleSpecificFields(role, data);

    return true;
  }

  validateUpdateUserInput(data) {
    const { email, role, relationship, date_of_birth } = data;

    if (role) {
      throw new AppError("Altering user role definitions post-creation is prohibited", 400);
    }

    if (email) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        throw new AppError("Invalid email address format", 400);
      }
    }

    if (relationship && !RELATIONSHIP_VALUES.includes(relationship)) {
      throw new AppError("Relationship must be father, mother, or guardian", 400);
    }

    if (date_of_birth && isNaN(Date.parse(date_of_birth))) {
      throw new AppError("Provided date of birth is an invalid date string format", 400);
    }

    return true;
  }

  _validateRoleSpecificFields(role, data) {
    switch (role) {
      case "student":
        if (!data.date_of_birth || !data.grade) {
          throw new AppError("Students require a valid date of birth and grade designation", 400);
        }
        if (isNaN(Date.parse(data.date_of_birth))) {
          throw new AppError("Invalid date format provided for student date of birth", 400);
        }
        break;

      case "teacher":
        if (!data.subjects) {
          throw new AppError("Teachers require assigned subjects field specification", 400);
        }
        break;

      case "parent":
        if (!data.relationship) {
          throw new AppError("Parents require a valid relationship field (father, mother, guardian)", 400);
        }
        if (!RELATIONSHIP_VALUES.includes(data.relationship)) {
          throw new AppError("Relationship must strictly match father, mother, or guardian", 400);
        }
        break;

      case "admin":
        break;
    }
  }
}

export default new AdminValidator();