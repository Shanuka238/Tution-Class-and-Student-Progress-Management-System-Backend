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

import { uploadProfileImage, deleteProfileImage } from "../helpers/cloudinaryhelper.js";
import AppError from "../errors/apperror.js";
import { USER_ROLES } from "../enums/userenum.js";

class AuthService {
  // Register a new user with role-specific profile
  async register(payload) {
    validateRegisterInput(payload);
    validateByRole(payload.role, payload);

    // Check if email already exists
    const exists = await userDAO.existsByEmail(payload.email);
    if (exists) {
      throw new AppError("User already exists with this email", 409);
    }

    // For students, verify parent exists
    if (payload.role === USER_ROLES.STUDENT) {
      const parent = await parentDAO.findById(payload.parent_id);
      if (!parent) {
        throw new AppError("Parent not found with given parent_id", 404);
      }
    }

    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create base user
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

      await session.commitTransaction();
      session.endSession();

      // Generate JWT token
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

  // Create role-specific profile based on user role
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

  // Authenticate user and return profile
  async login(credentials) {
    validateLoginInput(credentials);

    // Find user by email
    const user = await userDAO.findByEmail(credentials.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check if account is active
    if (!user.is_active) {
      throw new AppError("Account is deactivated", 403);
    }

    // Verify password
    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    // Validate requested role matches user role
    if (credentials.role && user.role !== credentials.role) {
      throw new AppError(
        `Account is not registered as ${credentials.role}`,
        403
      );
    }

    // Fetch role-specific profile
    const profile = await this._fetchRoleProfile(user);

    // Update last login for admin
    if (user.role === USER_ROLES.ADMIN) {
      await adminDAO.updateLastLogin(user._id);
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return {
      token,
      user: toUserDTO(user),
      profile,
    };
  }

  // Fetch role-specific profile by user role
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

  // Get complete user profile including role-specific data
  async getProfile(userId) {
    // Fetch user by ID
    const user = await userDAO.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Fetch role-specific profile
    const profile = await this._fetchRoleProfile(user);

    return {
      user: toUserDTO(user),
      profile,
    };
  }

  // Update user profile and role-specific data
  async updateUserProfile(userId, role, updateData) {
    const user = await userDAO.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const {
      first_name,
      last_name,
      phone,
      grade,
      address,
      date_of_birth,
      emergency_contact,
      subjects,
      qualifications,
      occupation,
      relationship,
      department
    } = updateData;

    // Update user basic fields
    const userUpdate = {};
    if (first_name !== undefined) userUpdate.first_name = first_name.trim();
    if (last_name !== undefined) userUpdate.last_name = last_name.trim();
    if (phone !== undefined) userUpdate.phone = phone.trim();

    let updatedUser = user;
    if (Object.keys(userUpdate).length > 0) {
      updatedUser = await userDAO.update(userId, userUpdate);
    }

    // Update role profile fields
    const profileUpdate = {};
    if (role === USER_ROLES.STUDENT) {
      if (grade !== undefined) profileUpdate.grade = grade;
      if (address !== undefined) profileUpdate.address = address;
      if (date_of_birth !== undefined) profileUpdate.date_of_birth = date_of_birth;
      if (emergency_contact !== undefined) profileUpdate.emergency_contact = emergency_contact;
      if (Object.keys(profileUpdate).length > 0) {
        await studentDAO.updateByUserId(userId, profileUpdate);
      }
    } else if (role === USER_ROLES.TEACHER) {
      if (subjects !== undefined) profileUpdate.subjects = subjects;
      if (qualifications !== undefined) profileUpdate.qualifications = qualifications;
      if (address !== undefined) profileUpdate.address = address;
      if (phone !== undefined) profileUpdate.phone = phone;
      if (Object.keys(profileUpdate).length > 0) {
        await teacherDAO.updateByUserId(userId, profileUpdate);
      }
    } else if (role === USER_ROLES.PARENT) {
      if (address !== undefined) profileUpdate.address = address;
      if (occupation !== undefined) profileUpdate.occupation = occupation;
      if (emergency_contact !== undefined) profileUpdate.emergency_contact = emergency_contact;
      if (relationship !== undefined) profileUpdate.relationship = relationship;
      if (Object.keys(profileUpdate).length > 0) {
        await parentDAO.updateByUserId(userId, profileUpdate);
      }
    } else if (role === USER_ROLES.ADMIN) {
      if (department !== undefined) profileUpdate.department = department;
      if (Object.keys(profileUpdate).length > 0) {
        await adminDAO.updateByUserId(userId, profileUpdate);
      }
    }

    const freshProfile = await this._fetchRoleProfile(updatedUser);

    return {
      user: toUserDTO(updatedUser),
      profile: freshProfile,
    };
  }

  // Upload and update user profile image
  async updateProfileImage(userId, fileBuffer) {
    if (!fileBuffer) {
      throw new AppError("No image file provided", 400);
    }

    const user = await userDAO.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Delete old profile image from Cloudinary if exists
    if (user.profile_image) {
      try {
        const publicId = user.profile_image.split("/").slice(-2).join("/").split(".")[0];
        await deleteProfileImage(publicId);
      } catch (error) {
        console.warn("Could not delete old image:", error);
      }
    }

    const fileName = `profile_${userId}_${Date.now()}`;
    const cloudinaryResult = await uploadProfileImage(fileBuffer, fileName);

    await userDAO.update(userId, { profile_image: cloudinaryResult.secure_url });
    const updatedUser = await userDAO.findById(userId);

    return {
      user: toUserDTO(updatedUser),
      imageUrl: cloudinaryResult.secure_url,
    };
  }

  // Change user password
  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new AppError("Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError("New password must be at least 6 characters long", 400);
    }

    const user = await userDAO.findByIdWithPassword(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError("Incorrect current password", 400);
    }

    user.password = newPassword;
    await user.save();

    return { message: "Password updated successfully" };
  }
}

export default new AuthService();