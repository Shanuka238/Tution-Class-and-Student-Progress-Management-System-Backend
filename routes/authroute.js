import express from "express";
import {
  register,
  login,
  getMe,
  uploadProfileImage_Handler,
  updateProfile_Handler,
  changePassword_Handler,
} from "../controllers/authcontroller.js";
import { protect } from "../middlewares/authmiddleware.js";
import upload from "../middlewares/uploadmiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile_Handler);
router.put("/change-password", protect, changePassword_Handler);
router.post("/profile-image", protect, upload.single("profileImage"), uploadProfileImage_Handler);

export default router;