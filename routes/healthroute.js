import express from 'express';
import { healthCheck } from '../controllers/healthcontroller.js';

const router = express.Router();

// GET /health - API health check and server uptime status
router.get('/', healthCheck);

export default router;
