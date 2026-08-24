import AppError from "../errors/apperror.js";


//Validates and formats Sri Lankan telephone numbers to standard E.164 (+94XXXXXXXXX)
export function validateAndFormatPhone(phone, fieldName = "Phone number") {
  if (!phone || !String(phone).trim()) return "";

  let cleaned = String(phone).trim().replace(/[\s\-()]/g, "");

  // Convert leading 07XXXXXXXX to +947XXXXXXXX
  if (/^07\d{8}$/.test(cleaned)) {
    cleaned = "+94" + cleaned.substring(1);
  } else if (/^7\d{8}$/.test(cleaned)) {
    cleaned = "+94" + cleaned;
  }

  // Validate E.164 format for Sri Lanka
  const sriLankaRegex = /^\+94\d{9}$/;
  if (!sriLankaRegex.test(cleaned)) {
    throw new AppError(
      `${fieldName} must be a valid Sri Lankan phone number starting with +94 followed by 9 digits (e.g. +94771234567)`,
      400
    );
  }

  return cleaned;
}
