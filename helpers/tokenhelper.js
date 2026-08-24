import jwt from "jsonwebtoken";

/**
 * Generate signed JWT access token for user authentication
 * @param {string} userId MongoDB User ID
 * @param {string} role User role (admin, teacher, student, parent)
 */
export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

/**
 * Verify and decode signed JWT token
 * @param {string} token Bearer JWT token string
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};