import express from "express";
import adminController from "../controllers/admincontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/users", authorize("admin", "teacher"), adminController.getAllUsers);

router.use(authorize("admin"));
router.post("/users", adminController.createUser);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

export default router;