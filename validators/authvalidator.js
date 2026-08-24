import AppError from "../errors/apperror.js";
import { ROLE_VALUES } from "../enums/userenum.js";

// Validate user registration request body payload
export const validateRegisterInput = (data) => {
  const { first_name, last_name, email, password, role } = data;

  if (!first_name || !last_name || !email || !password || !role) {
    throw new AppError("Missing required fields", 400);
  }

  if (!ROLE_VALUES.includes(role)) {
    throw new AppError("Invalid role specified", 400);
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  return true;
};

// Validate user login credentials input
export const validateLoginInput = (data) => {
  const { email, password } = data;
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }
  return true;
};