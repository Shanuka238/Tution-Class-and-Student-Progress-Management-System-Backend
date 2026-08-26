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

// Initialize Express Application
const app = express();

// Configure Allowed CORS Origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : [])
];

// Global Security & Parsing Middlewares
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin is explicitly allowed or matches a Vercel deployment domain
    const isAllowed = allowedOrigins.some(allowed => allowed === origin || origin.endsWith('.vercel.app'));
    if (isAllowed) {
      return callback(null, true);
    }
    
    // In development mode, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
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

// Ensure Database is connected for every incoming request (crucial for Serverless/Vercel and local)
app.use(async (req, res, next) => {
  // Allow health checks to run without blocking on database
  if (req.path === '/' || req.path === '/health') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Root & Health Verification Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    service: 'EduManage 360 API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});
app.use('/health', healthRoute);

// Core API Routes
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

// Catch-all 404 Route Handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

// Start Express Server (only in standalone Node / Render / local environments, not on Vercel serverless)
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  }).catch((err) => {
    console.error(`❌ Failed to start server due to DB connection error: ${err.message}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    process.exit(1);
  });
}

export default app;
