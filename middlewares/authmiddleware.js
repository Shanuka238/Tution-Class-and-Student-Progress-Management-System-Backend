import { verifyToken } from "../helpers/tokenhelper.js";
import userDAO from "../daos/userdao.js";
import AppError from "../errors/apperror.js";

 //Authentication Middleware: Verifies incoming JWT Bearer token in request headers
export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Not authorized. No token provided.", 401);
    }

    // Decode and verify JWT signature
    const decoded = verifyToken(token);
    const user = await userDAO.findById(decoded.id);

    // Verify account exists and is not disabled
    if (!user || !user.is_active) {
      throw new AppError("User no longer exists or is inactive", 401);
    }

    // Attach authenticated user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

 //Authorization Middleware: Enforces Role-Based Access Control (RBAC)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Role not authorized to access this route", 403));
    }
    next();
  };
};