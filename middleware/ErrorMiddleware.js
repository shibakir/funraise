const apiError = require('../exception/ApiError');

module.exports = function (err, req, res, next) {
    // log all errors for debugging
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
        ...(err.originalError && { originalError: err.originalError.message })
    });

    // Handle ApiError instances
    if (err instanceof apiError) {
        return res.status(err.status).json({
            message: err.message,
            errors: err.errors,
            status: err.status,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack,
                originalError: err.originalError
            })
        });
    }

    // Handle GraphQL errors that might be thrown from context
    if (err.statusCode === 401) {
        return res.status(401).json({
            message: err.message || 'Unauthorized',
            status: 401
        });
    }

    // handle specific database errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(422).json({
            message: 'Validation error',
            errors: err.errors.map(e => e.message),
            status: 422
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            message: 'Resource already exists',
            errors: err.errors.map(e => `${e.path} must be unique`),
            status: 409
        });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            message: 'Invalid reference',
            errors: ['Referenced resource does not exist'],
            status: 400
        });
    }

    // fallback for unexpected errors
    return res.status(500).json({
        message: 'Unexpected server error',
        errors: [err.message],
        status: 500,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack
        })
    });
};