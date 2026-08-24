import express from "express";
import parentController from "../controllers/parentcontroller.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Require authentication and Parent role for all parent portal endpoints
router.use(protect);
router.use(authorize("parent"));

// GET /parents/me/children - Fetch all linked child profiles for logged-in parent
router.get("/me/children", parentController.getMyChildren);

// GET /parents/children/:studentId/progress - Fetch 360-degree academic progress for a specific child
router.get("/children/:studentId/progress", parentController.getChildProgress);

export default router;
