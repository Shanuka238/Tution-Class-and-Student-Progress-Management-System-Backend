import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/mongodb.js";
import errorHandler from "./middlewares/errormiddleware.js";

// Route imports
import healthRoute from "./routes/healthroute.js";
import authRoute from "./routes/authroute.js";
import adminRoute from "./routes/adminroute.js";
import classRoute from "./routes/classroute.js";
import attendanceRoute from "./routes/attendanceroute.js";
import examRoute from "./routes/examroute.js";
import feeRoute from "./routes/feeroute.js";
import parentRoute from "./routes/parentroute.js";
import notificationRoute from "./routes/notificationroute.js";
import chatbotRoute from "./routes/chatbotroute.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

// Initialize Express Application
const app = express();

// Global Security & Parsing Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger for development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Register API Route Handlers
app.use('/health', healthRoute);
app.use('/auth', authRoute);
app.use('/admin', adminRoute);
app.use('/classes', classRoute);
app.use('/attendance', attendanceRoute);
app.use('/exams', examRoute);
app.use('/fees', feeRoute);
app.use('/parents', parentRoute);
app.use('/notifications', notificationRoute);
app.use('/chatbot', chatbotRoute);

// Debug route to verify Cloudinary configuration (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/debug/cloudinary', (req, res) => {
    res.json({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'NOT SET',
    });
  });
}

// Default Base API Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to EduTracker API',
    docs: '/health'
  });
});

// Catch-all 404 Route Handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

// Start Express Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
