// Custom error class extending the built-in Error class
class ApiError extends Error {
    constructor(status, message, errors = [], originalError = null) {
        super(message); // Call the parent constructor with the main error message
        this.status = status; // HTTP status code (e.g., 400, 404, 500)
        this.errors = errors; // Array of specific error details (e.g., validation issues)
        this.originalError = originalError; // Original error object (for deeper debugging)
        
        // If original error has a stack trace, use it (helps in debugging)
        if (originalError && originalError.stack) {
            this.stack = originalError.stack;
        }
    }

    // Static method for creating a 400 Bad Request error
    static badRequest(message, errors = [], originalError = null) {
        return new ApiError(400, message, errors, originalError);
    }

    // Static method for creating a 401 Unauthorized error
    static unauthorized(message = 'User not authorized') {
        return new ApiError(401, message);
    }

    // Static method for creating a 403 Forbidden error
    static forbidden(message = 'Access denied') {
        return new ApiError(403, message);
    }

    // Static method for creating a 404 Not Found error
    static notFound(message = 'Not found') {
        return new ApiError(404, message);
    }

    // Static method for creating a 409 Conflict error
    static conflict(message = 'Resource already exists', errors = []) {
        return new ApiError(409, message, errors);
    }

    // Static method for creating a 422 Unprocessable Entity error
    // Typically used for validation failures
    static unprocessableEntity(message = 'Validation failed', errors = []) {
        return new ApiError(422, message, errors);
    }

    // Static method for creating a 500 Internal Server Error
    static internal(message = 'Server internal error', errors = [], originalError = null) {
        return new ApiError(500, message, errors, originalError);
    }

    // Utility method for database-related server errors (500)
    static database(message = 'Database error', originalError = null) {
        return new ApiError(500, message, ['Database operation failed'], originalError);
    }

    // Utility method for validation errors with status code 422
    static validation(message, validationErrors = []) {
        return new ApiError(422, message, validationErrors);
    }

    // Utility method for business logic errors with status code 400
    static businessLogic(message, details = []) {
        return new ApiError(400, message, details);
    }
}

// Export the class so it can be used in other modules
module.exports = ApiError;
