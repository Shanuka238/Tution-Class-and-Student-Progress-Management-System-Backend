import authService from "../services/authservice.js";

class AuthController {
  // Register a new user
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Authenticate user and return token
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current logged-in user profile
  async getMe(req, res, next) {
    try {
      const user = await authService.getProfile(req.user._id);
      return res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload profile image
  async uploadProfileImage(req, res, next) {
    try {
      const result = await authService.updateProfileImage(req.user._id, req.file?.buffer);
      return res.status(200).json({
        success: true,
        message: "Profile image uploaded successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update personal profile information
  async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const role = req.user.role;
      const result = await authService.updateUserProfile(userId, role, req.body);
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Change user password (authenticated)
  async changePassword(req, res, next) {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      return res.status(200).json({
        success: true,
        message: result.message || "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset user password by email (public / forgot password)
  async resetPassword(req, res, next) {
    try {
      const { email, newPassword } = req.body;
      const result = await authService.resetPasswordByEmail(email, newPassword);
      return res.status(200).json({
        success: true,
        message: result.message || "Password updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();