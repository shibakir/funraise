const ApiError = require('../../exception/ApiError');

/**
 * Handles errors from services and converts them into GraphQL-compatible Error
 * @param {Error} error - Base error
 * @param {string} fallbackMessage - Fallback message if not ApiError
 * @throws {Error} GraphQL-compatible error
 */
function handleServiceError(error, fallbackMessage = 'Operation failed') {
    if (error instanceof ApiError) {
        const errorMessage = error.errors && error.errors.length > 0 
            ? `${error.message}: ${error.errors.join(', ')}`
            : error.message;
        throw new Error(errorMessage);
    }
    
    throw new Error(error.message || fallbackMessage);
}

module.exports = {
    handleServiceError
}; 