import authService from "../services/authservice.js";
import { sendResponse } from "../utils/apiresponse.js";
import userDAO from "../daos/userdao.js";
import { uploadProfileImage, deleteProfileImage } from "../helpers/cloudinaryhelper.js";
import AppError from "../errors/apperror.js";

// Wrapper to handle async errors in Express
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('Controller error:', err);
    next(err);
  });
};

// Register a new user
export const register = asyncHandler(async (req, res) => {
  console.log('Register endpoint called with body:', req.body);
  const result = await authService.register(req.body);
  return sendResponse(res, 201, true, "User registered successfully", result);
});

// Authenticate user and return token
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return sendResponse(res, 200, true, "Login successful", result);
});

// Get current logged-in user profile
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  return sendResponse(res, 200, true, "Profile fetched successfully", { user });
});

// Upload profile image
export const uploadProfileImage_Handler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No image file provided", 400);
  }

  // Get current user
  const user = await userDAO.findById(req.user._id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Delete old profile image if exists
  if (user.profile_image) {
    try {
      const publicId = user.profile_image.split('/').slice(-2).join('/').split('.')[0];
      await deleteProfileImage(publicId);
    } catch (error) {
      console.warn("Could not delete old image:", error);
    }
  }

  // Upload new image to Cloudinary
  const fileName = `profile_${req.user._id}_${Date.now()}`;
  const cloudinaryResult = await uploadProfileImage(req.file.buffer, fileName);

  // Update user with new image URL
  user.profile_image = cloudinaryResult.secure_url;
  await userDAO.update(user._id, { profile_image: cloudinaryResult.secure_url });

  const updatedUser = await userDAO.findById(req.user._id);

  return sendResponse(res, 200, true, "Profile image uploaded successfully", {
    user: updatedUser,
    imageUrl: cloudinaryResult.secure_url,
  });
});

// Update personal profile information
export const updateProfile_Handler = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;
  const result = await authService.updateUserProfile(userId, role, req.body);
  return sendResponse(res, 200, true, "Profile updated successfully", result);
});

// Change user password
export const changePassword_Handler = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(userId, currentPassword, newPassword);
  return sendResponse(res, 200, true, result.message || "Password changed successfully");
});