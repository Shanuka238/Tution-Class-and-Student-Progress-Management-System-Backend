import express from "express";
import authController from "../controllers/authcontroller.js";
import { protect } from "../middlewares/authmiddleware.js";
import upload from "../middlewares/uploadmiddleware.js";

const router = express.Router();

// Public Authentication Endpoints
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);


// Protected User Profile & Security Endpoints
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);
router.put("/change-password", protect, authController.changePassword);
router.post("/profile-image", protect, upload.single("profileImage"), authController.uploadProfileImage);

export default router;