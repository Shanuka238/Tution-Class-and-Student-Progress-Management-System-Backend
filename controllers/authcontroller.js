import authService from "../services/authservice.js";
import { sendResponse } from "../utils/apiresponse.js";

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