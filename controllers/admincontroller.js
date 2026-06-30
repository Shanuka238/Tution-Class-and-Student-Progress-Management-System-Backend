import adminService from "../services/adminservice.js";
import adminValidator from "../validators/adminvalidator.js";
import ApiResponse from "../utils/apiresponse.js";

class AdminController {
  // Fetch all users with their role profiles
  async getAllUsers(req, res, next) {
    try {
      const data = await adminService.getAllUsers();
      return res.status(200).json({
        success: true,
        message: "All users and profiles retrieved successfully",
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // Fetch a specific user by ID with profile
  async getUserById(req, res, next) {
    try {
      const data = await adminService.getUserById(req.params.id);
      return res.status(200).json({
        success: true,
        message: "User context fetched successfully",
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // Create a new user with validation
  async createUser(req, res, next) {
    try {
      // Validate input structure
      adminValidator.validateCreateUserInput(req.body);

      const data = await adminService.createUser(req.body);
      return res.status(201).json({
        success: true,
        message: "User account and profile established successfully",
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user and profile information
  async updateUser(req, res, next) {
    try {
      // Validate update input
      adminValidator.validateUpdateUserInput(req.body);

      const data = await adminService.updateUser(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user with soft or hard delete mode
  async deleteUser(req, res, next) {
    try {
      // Get delete mode from query parameters (soft or hard)
      const mode = req.query.mode || "soft";
      const result = await adminService.deleteUser(req.params.id, mode);
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();