import express from "express";
import adminController from "../controllers/admincontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.route("/users")
    .get(adminController.getAllUsers)
    .post(adminController.createUser);

router.route("/users/:id")
    .get(adminController.getUserById)
    .put(adminController.updateUser)
    .delete(adminController.deleteUser);

export default router;