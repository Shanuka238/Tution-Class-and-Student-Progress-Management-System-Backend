import mongoose from "mongoose";
import userDAO from "../daos/userdao.js";
import adminDAO from "../daos/admindao.js";
import studentDAO from "../daos/studentdao.js";
import teacherDAO from "../daos/teacherdao.js";
import parentDAO from "../daos/parentdao.js";
import AppError from "../errors/apperror.js";
import { validateAndFormatPhone } from "../validators/phonevalidator.js";

class AdminService {
  // Fetch all users with their role-specific profiles
  async getAllUsers() {
    const users = await userDAO.findAll();
    
    // Load profiles concurrently for all users
    return await Promise.all(
      users.map(async (user) => {
        const profile = await this._fetchProfileByRole(user.user_id, user.role);
        return { user, profile };
      })
    );
  }

  // Fetch a single user by ID with profile
  async getUserById(userId) {
    const user = await userDAO.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const profile = await this._fetchProfileByRole(user.user_id, user.role);
    return { user, profile };
  }

  // Create a new user with role-specific profile
  async createUser(payload) {
    // Validate & format phone numbers to Sri Lankan format (+94)
    if (payload.phone) {
      payload.phone = validateAndFormatPhone(payload.phone, "Phone number");
    }
    if (payload.emergency_contact) {
      payload.emergency_contact = validateAndFormatPhone(payload.emergency_contact, "Emergency contact phone");
    }

    // Check if email already exists
    const emailExists = await userDAO.existsByEmail(payload.email);
    if (emailExists) throw new AppError("Email is already registered", 400);

    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create base user
      const user = await userDAO.createWithSession(payload, session);

      // Create role-specific profile
      const profileData = { user_id: user._id, ...payload };
      const profile = await this._createProfileByRole(user.role, profileData, session);

      await session.commitTransaction();
      return { user, profile };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Update user base fields and role-specific profile
  async updateUser(userId, payload) {
    // Validate & format phone numbers to Sri Lankan format (+94)
    if (payload.phone) {
      payload.phone = validateAndFormatPhone(payload.phone, "Phone number");
    }
    if (payload.emergency_contact) {
      payload.emergency_contact = validateAndFormatPhone(payload.emergency_contact, "Emergency contact phone");
    }

    // Verify user exists
    const user = await userDAO.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Separate base user fields from profile-specific fields
      const { first_name, last_name, phone, profile_image, is_active, ...profileFields } = payload;
      const baseUpdate = { first_name, last_name, phone, profile_image, is_active };

      // Remove undefined values from update object
      Object.keys(baseUpdate).forEach(k => baseUpdate[k] === undefined && delete baseUpdate[k]);

      // Update base user and role-specific profile
      const updatedUser = await userDAO.updateWithSession(userId, baseUpdate, session);
      const updatedProfile = await this._updateProfileByRole(userId, user.role, profileFields, session);

      await session.commitTransaction();
      return { user: updatedUser, profile: updatedProfile };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Delete user with soft or hard delete mode
  async deleteUser(userId, mode = "soft") {
    // Verify user exists
    const user = await userDAO.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (mode === "hard") {
        // Permanently delete user and profile
        await this._deleteProfileByRole(userId, user.role, session);
        await userDAO.hardDeleteWithSession(userId, session);
        await session.commitTransaction();
        return { message: "User data permanently purged from the system cluster" };
      } else {
        // Soft delete by deactivating user
        const disabledUser = await userDAO.softDeleteWithSession(userId, session);
        await session.commitTransaction();
        return { user: disabledUser, message: "User deactivated successfully" };
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Fetch role-specific profile by role type
  async _fetchProfileByRole(userId, role) {
    switch (role) {
      case "student": return await studentDAO.findByUserId(userId);
      case "teacher": return await teacherDAO.findByUserId(userId);
      case "parent":  return await parentDAO.findByUserId(userId);
      case "admin":   return await adminDAO.findByUserId(userId);
      default: return null;
    }
  }

  // Create role-specific profile based on role type
  async _createProfileByRole(role, data, session) {
    switch (role) {
      case "student": return await studentDAO.create(data, session);
      case "teacher": return await teacherDAO.create(data, session);
      case "parent":  return await parentDAO.create(data, session);
      case "admin":   return await adminDAO.create(data, session);
      default: return null;
    }
  }

  // Update role-specific profile based on role type
  async _updateProfileByRole(userId, role, data, session) {
    switch (role) {
      case "student": return await studentDAO.updateByUserId(userId, data, session);
      case "teacher": return await teacherDAO.updateByUserId(userId, data, session);
      case "parent":  return await parentDAO.updateByUserId(userId, data, session);
      case "admin":   return await adminDAO.updateByUserId(userId, data, session);
      default: return null;
    }
  }

  // Delete role-specific profile based on role type
  async _deleteProfileByRole(userId, role, session) {
    switch (role) {
      case "student": return await studentDAO.deleteByUserId(userId, session);
      case "teacher": return await teacherDAO.deleteByUserId(userId, session);
      case "parent":  return await parentDAO.deleteByUserId(userId, session);
      case "admin":   return await adminDAO.deleteByUserId(userId, session);
      default: return null;
    }
  }
}

export default new AdminService();