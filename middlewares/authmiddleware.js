import { verifyToken } from "../helpers/tokenhelper.js";
import userDAO from "../daos/userdao.js";
import AppError from "../errors/apperror.js";

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Not authorized. No token provided.", 401);
    }

    const decoded = verifyToken(token);
    const user = await userDAO.findById(decoded.id);

    if (!user || !user.is_active) {
      throw new AppError("User no longer exists or is inactive", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Role not authorized to access this route", 403));
    }
    next();
  };
};