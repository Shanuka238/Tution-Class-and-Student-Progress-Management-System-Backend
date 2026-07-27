import express from "express";
import parentController from "../controllers/parentcontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("parent"));

router.get("/me/children", parentController.getMyChildren);
router.get("/children/:studentId/progress", parentController.getChildProgress);

export default router;
