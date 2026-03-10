/**
 * Global Error Handling Middleware
 * 
 * Catches all errors thrown from controllers or down the middleware chain.
 * Normalizes error responses based on whether we are in dev or prod environment.
 */
const errorHandler = (err, req, res, next) => {
    // Set default status code and status if they aren't provided by the error
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // In development, send detailed error information including stack trace
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // In production, send minimal information
    if (err.isOperational) {
        // Trusted operational error: send message to client
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // Programming or other unknown error: don't leak bug details
    const logger = require('../config/logger');
    logger.error('ERROR 💥', err); // Using Winston logger instead of console.error

    return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
    });
};

module.exports = errorHandler;
