/**
 * Custom Error Class for the application
 * Extends the built-in Error class to include HTTP status codes and operational status.
 */
class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Flag for operational errors (vs programming/system errors)
    this.errors = errors; // Optional list of field-level validation errors

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
