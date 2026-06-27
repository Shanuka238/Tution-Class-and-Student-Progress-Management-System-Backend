import mongoose from "mongoose";

import userDAO from "../daos/userdao.js";
import adminDAO from "../daos/admindao.js";
import parentDAO from "../daos/parentdao.js";
import studentDAO from "../daos/studentdao.js";
import teacherDAO from "../daos/teacherdao.js";

import { generateToken } from "../helpers/tokenhelper.js";
import {
  generateStudentNumber,
  generateTeacherNumber,
} from "../helpers/numbergenerator.js";

import { toUserDTO } from "../mappers/usermapper.js";
import { toAdminDTO } from "../mappers/adminmapper.js";
import { toParentDTO } from "../mappers/parentmapper.js";
import { toStudentDTO } from "../mappers/studentmapper.js";
import { toTeacherDTO } from "../mappers/teachermapper.js";

import {
  validateRegisterInput,
  validateLoginInput,
} from "../validators/authvalidator.js";
import { validateByRole } from "../validators/rolevalidator.js";

import AppError from "../errors/apperror.js";
import { USER_ROLES } from "../enums/userenum.js";

class AuthService {
  /**
   * Register a user along with role-specific profile.
   * Uses MongoDB transaction for atomicity.
   */
  async register(payload) {
    // 1. Validate base User fields
    validateRegisterInput(payload);

    // 2. Validate role-specific fields
    validateByRole(payload.role, payload);

    // 3. Email uniqueness check
    const exists = await userDAO.existsByEmail(payload.email);
    if (exists) {
      throw new AppError("User already exists with this email", 409);
    }

    // 4. If student, parent must exist
    if (payload.role === USER_ROLES.STUDENT) {
      const parent = await parentDAO.findById(payload.parent_id);
      if (!parent) {
        throw new AppError("Parent not found with given parent_id", 404);
      }
    }

    // 5. Begin transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create User
      const user = await userDAO.createWithSession(
        {
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          phone: payload.phone,
          profile_image: payload.profile_image,
        },
        session
      );

      // Create role-specific profile
      const profileDTO = await this._createRoleProfile(payload, user, session);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Generate JWT
      const token = generateToken(user._id, user.role);

      return {
        token,
        user: toUserDTO(user),
        profile: profileDTO,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Internal: create role-specific profile based on role.
   */
  async _createRoleProfile(payload, user, session) {
    switch (payload.role) {
      case USER_ROLES.ADMIN: {
        const admin = await adminDAO.create(
          { user_id: user._id },
          session
        );
        return toAdminDTO(admin, user);
      }

      case USER_ROLES.PARENT: {
        const parent = await parentDAO.create(
          {
            user_id: user._id,
            occupation: payload.occupation || "",
            address: payload.address || "",
            relationship: payload.relationship,
            emergency_contact: payload.emergency_contact || "",
          },
          session
        );
        return toParentDTO(parent, user);
      }

      case USER_ROLES.STUDENT: {
        const studentNumber = await generateStudentNumber();
        const student = await studentDAO.create(
          {
            user_id: user._id,
            parent_id: payload.parent_id,
            student_number: studentNumber,
            date_of_birth: payload.date_of_birth,
            grade: payload.grade,
            address: payload.address || "",
          },
          session
        );
        return toStudentDTO(student, user);
      }

      case USER_ROLES.TEACHER: {
        const teacherNumber = await generateTeacherNumber();
        const teacher = await teacherDAO.create(
          {
            user_id: user._id,
            teacher_number: teacherNumber,
            subjects: payload.subjects,
            qualifications: payload.qualifications,
          },
          session
        );
        return toTeacherDTO(teacher, user);
      }

      default:
        throw new AppError("Invalid role", 400);
    }
  }

  /**
   * Login user — fetches role profile too.
   */
  async login(credentials) {
    validateLoginInput(credentials);

    const user = await userDAO.findByEmail(credentials.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.is_active) {
      throw new AppError("Account is deactivated", 403);
    }

    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    if (credentials.role && user.role !== credentials.role) {
      throw new AppError(
        `Account is not registered as ${credentials.role}`,
        403
      );
    }

    // Fetch role-specific profile
    const profile = await this._fetchRoleProfile(user);

    // Update last_login if admin
    if (user.role === USER_ROLES.ADMIN) {
      await adminDAO.updateLastLogin(user._id);
    }

    const token = generateToken(user._id, user.role);

    return {
      token,
      user: toUserDTO(user),
      profile,
    };
  }

  /**
   * Internal: fetch role-specific profile by user.
   */
  async _fetchRoleProfile(user) {
    switch (user.role) {
      case USER_ROLES.ADMIN: {
        const admin = await adminDAO.findByUserId(user._id);
        return toAdminDTO(admin);
      }
      case USER_ROLES.PARENT: {
        const parent = await parentDAO.findByUserId(user._id);
        return toParentDTO(parent);
      }
      case USER_ROLES.STUDENT: {
        const student = await studentDAO.findByUserId(user._id);
        return toStudentDTO(student);
      }
      case USER_ROLES.TEACHER: {
        const teacher = await teacherDAO.findByUserId(user._id);
        return toTeacherDTO(teacher);
      }
      default:
        return null;
    }
  }

  /**
   * Get logged-in user's full profile (user + role data).
   */
  async getProfile(userId) {
    const user = await userDAO.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const profile = await this._fetchRoleProfile(user);

    return {
      user: toUserDTO(user),
      profile,
    };
  }
}

export default new AuthService();