import express from "express";
import adminController from "../controllers/admincontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Apply authentication middleware to all admin endpoints
router.use(protect);

// GET /admin/users - Retrieve user accounts (Accessible by Admin and Teacher)
router.get("/users", authorize("admin", "teacher"), adminController.getAllUsers);

// Restrict user CRUD management endpoints strictly to Admins
router.use(authorize("admin"));
router.post("/users", adminController.createUser);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

export default router;