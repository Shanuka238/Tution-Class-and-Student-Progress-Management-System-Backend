import ApiResponse from '../utils/apiresponse.js';
import mongoose from 'mongoose';

export const healthCheck = (req, res) => {
  console.log('Health check endpoint called');
  
  const healthData = {
    service: 'EduTracker API',
    status: 'healthy',
    environment: process.env.NODE_ENV,
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    mongoState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };

  console.log('📊 Health data:', healthData);
  
  try {
    return ApiResponse.success(res, healthData, 'System is healthy');
  } catch (err) {
    console.error('Error in healthCheck:', err);
    return res.status(500).json({ success: false, message: 'Health check failed', error: err.message });
  }
};
