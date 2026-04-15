/**
 * Global Error Handling Middleware
 * 
 * Catches all errors thrown from controllers or down the middleware chain.
 * Normalizes error responses based on whether we are in dev or prod environment.
 */
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    // Set default status code and status if they aren't provided by the error
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error for server-side visibility, regardless of environment
    logger.error(`[API ERROR] ${req.method} ${req.originalUrl}`, {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode
    });

    // In development, send detailed error information including stack trace to client
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack
        });
    }

    // In production, send minimal information
    if (err.isOperational) {
        // Trusted operational error: send message to client
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    }

    // Programming or other unknown error: don't leak bug details
    logger.error(`[UNHANDLED ERROR] ${req.method} ${req.originalUrl}`, err);

    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went very wrong! Please contact support.'
    });
};

module.exports = errorHandler;
