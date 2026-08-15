import AppError from "../errors/apperror.js";

export function validateAndFormatPhone(phone, fieldName = "Phone number") {
  if (!phone || !String(phone).trim()) return "";

  let cleaned = String(phone).trim().replace(/[\s\-()]/g, "");

  if (/^07\d{8}$/.test(cleaned)) {
    cleaned = "+94" + cleaned.substring(1);
  } else if (/^7\d{8}$/.test(cleaned)) {
    cleaned = "+94" + cleaned;
  }

  const sriLankaRegex = /^\+94\d{9}$/;
  if (!sriLankaRegex.test(cleaned)) {
    throw new AppError(
      `${fieldName} must be a valid Sri Lankan phone number starting with +94 followed by 9 digits (e.g. +94771234567)`,
      400
    );
  }

  return cleaned;
}
