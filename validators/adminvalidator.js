import AppError from "../errors/apperror.js";
import { ROLE_VALUES, RELATIONSHIP_VALUES } from "../enums/userenum.js";


 //Admin User Management Request Validator
class AdminValidator {

  //Validate new user creation payload
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

  /**
   * Validate user profile update payload
   */
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

  /**
   * Internal helper to validate role-specific mandatory fields
   */
  _validateRoleSpecificFields(role, data) {
    switch (role) {
      case "student":
        if (!data.date_of_birth || !data.grade) {
          throw new AppError("Students require a valid date of birth and grade designation", 400);
        }
        if (isNaN(Date.parse(data.date_of_birth))) {
          throw new AppError("Invalid date of birth provided for student", 400);
        }
        if (!data.parent_id) {
          throw new AppError("A linked parent_id is required when registering a student", 400);
        }
        break;

      case "teacher":
        if (!data.subjects || !data.qualifications) {
          throw new AppError("Teachers require qualifications and teaching subject specializations", 400);
        }
        break;

      case "parent":
        if (!data.relationship) {
          throw new AppError("Parents require a defined relationship (father, mother, guardian)", 400);
        }
        if (!RELATIONSHIP_VALUES.includes(data.relationship)) {
          throw new AppError("Relationship must be father, mother, or guardian", 400);
        }
        break;

      case "admin":
        break;

      default:
        throw new AppError("Unrecognized user role definition", 400);
    }
  }
}

export default new AdminValidator();