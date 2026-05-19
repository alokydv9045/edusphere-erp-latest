/**
 * Global Error Handling Middleware
 * 
 * Catches all errors thrown from controllers or down the middleware chain.
 * Normalizes error responses based on whether we are in dev or prod environment.
 */
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    // Set default status code and status if they aren't provided by the error
    let statusCode = err.statusCode || 500;
    let status = err.status || 'error';
    let message = err.message || 'Something went very wrong! Please contact support.';
    let errors = err.errors || undefined;

    // ── PRISMA ERROR NORMALIZATION ──
    if (err.code) {
        switch (err.code) {
            case 'P2002': // Unique constraint failed
                statusCode = 400;
                message = `Duplicate field value: ${err.meta?.target || 'Resource already exists'}`;
                break;
            case 'P2025': // Record not found
                statusCode = 404;
                message = 'The requested resource was not found in the repository.';
                break;
            case 'P2003': // Foreign key constraint failed
                statusCode = 400;
                message = 'Integrity constraint violation. Please verify dependent records.';
                break;
            default:
                // Handle other Prisma codes as generic database errors
                if (err.code.startsWith('P')) {
                    statusCode = 400;
                    message = `Repository Error: ${err.code}`;
                }
        }
    }

    // ── JWT / AUTH NORMALIZATION ──
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token. Access denied.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication session expired. Please re-authenticate.';
    }

    // Log error for server-side visibility
    logger.error(`[API ERROR] ${req.method} ${req.originalUrl}`, {
        message: err.message,
        code: err.code,
        stack: err.stack,
        statusCode,
        errors
    });

    // In development, send error code/name for debugging but NEVER stack traces
    if (process.env.NODE_ENV === 'development') {
        return res.status(statusCode).json({
            success: false,
            status,
            message,
            errors,
            errorCode: err.code || undefined,
            errorName: err.name || undefined
        });
    }

    // In production, send cleaned response
    return res.status(statusCode).json({
        success: false,
        status,
        message: err.isOperational ? err.message : message,
        errors
    });
};

module.exports = errorHandler;
