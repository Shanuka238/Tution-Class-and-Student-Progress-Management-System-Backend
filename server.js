import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/MongoDb.js';
import errorHandler from './middlewares/errormiddleware.js';
import healthRoute from './routes/healthroute.js';
import authroute from './routes/authroute.js'
import adminRoute from "./routes/adminroute.js";
import classroute from "./routes/classroute.js"
import attendanceRoute from "./routes/attendanceroute.js";

dotenv.config();

// Connect to database
connectDB();
const app = express();

//Global Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//API Routes
app.use('/health', healthRoute);
console.log('✅ Health route should be accessible at /health');

app.use('/auth', authroute);

app.use('/admin', adminRoute);

app.use('/classes', classroute);

app.use('/attendance', attendanceRoute);

// Debug route to check Cloudinary config (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/debug/cloudinary', (req, res) => {
    res.json({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'NOT SET',
    });
  });
}

// Base route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to EduTracker API',
    docs: '/health'
  });
});

//ERROR Handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler);

//Start Sever
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Cloudinary Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`❌ Unhandled Error: ${err.message}`);
  server.close(() => process.exit(1));
});
