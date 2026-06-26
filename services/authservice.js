import userDAO from "../daos/userdao.js";
import { generateToken } from "../helpers/tokenhelper.js";
import { toUserDTO } from "../mappers/usermapper.js";
import AppError from "../errors/apperror.js";
import { validateRegisterInput, validateLoginInput } from "../validators/authvalidator.js";

class AuthService {
  async register(userData) {
    validateRegisterInput(userData);

    const exists = await userDAO.existsByEmail(userData.email);
    if (exists) {
      throw new AppError("User already exists with this email", 409);
    }

    const user = await userDAO.create(userData);
    const token = generateToken(user._id, user.role);

    return {
      token,
      user: toUserDTO(user),
    };
  }

  async login(credentials) {
    validateLoginInput(credentials);

    const user = await userDAO.findByEmail(credentials.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.is_active) {
      throw new AppError("Account is deactivated", 403);
    }

    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    if (credentials.role && user.role !== credentials.role) {
      throw new AppError(`Account is not registered as ${credentials.role}`, 403);
    }

    const token = generateToken(user._id, user.role);

    return {
      token,
      user: toUserDTO(user),
    };
  }

  async getProfile(userId) {
    const user = await userDAO.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return toUserDTO(user);
  }
}

export default new AuthService();