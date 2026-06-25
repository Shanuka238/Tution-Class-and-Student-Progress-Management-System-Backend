const ApiResponse = require('../utils/ApiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose: Bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Mongoose: Duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose: Validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;