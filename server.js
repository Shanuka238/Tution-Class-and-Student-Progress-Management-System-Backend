const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/MongoDb');
const errorHandler = require('./middleware/errormiddleware');

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
app.use('/health', require('./routes/healthroute'));

// Base route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to EduTracker API',
    docs: '/api/health'
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
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`❌ Unhandled Error: ${err.message}`);
  server.close(() => process.exit(1));
});