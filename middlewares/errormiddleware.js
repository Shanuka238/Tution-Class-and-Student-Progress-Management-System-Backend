//Centralized Express Error Handling Middleware
//Intercepts Mongoose, JWT, validation, and operational errors and returns structured JSON responses.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Server Error';

  console.error('Full error object:', err);
  console.error('Error name:', err.name);
  console.error('Error statusCode:', err.statusCode);

  // Mongoose: Invalid MongoDB ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Mongoose: Duplicate Unique Key Violation
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose: Schema Validation Error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  // JWT: Malformed or Invalid Signature
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  // JWT: Token Expiration Error
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  console.error(`❌ Error: ${message}`);

  return res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

export default errorHandler;
