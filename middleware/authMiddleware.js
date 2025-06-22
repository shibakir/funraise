const { verifyToken } = require('../utils/jwtUtils');
const ApiError = require('../exception/ApiError');

/**
 * Extracts token from GraphQL request headers
 * @param {Object} request - GraphQL request object
 * @returns {string|null} token or null if not found
 */
const extractTokenFromGraphQLRequest = (request) => {
    const authHeader = request.headers?.authorization || request.headers?.Authorization;
    return authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
};

/**
 * Gets user data from token in GraphQL request
 * @param {Object} request - GraphQL request object
 * @returns {Object|null} user data or null if no token provided
 * @throws {ApiError} 401 error if token is invalid
 */
const getUserFromGraphQLRequest = (request) => {
    const token = extractTokenFromGraphQLRequest(request);

    if (!token) {
        return null;
    }

    const user = verifyToken(token);
    if (!user) {
        throw ApiError.unauthorized('Invalid or expired token');
    }
    
    return user;
};

/**
 * Express middleware for GraphQL authorization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const graphqlAuthMiddleware = (req, res, next) => {
    try {
        const user = getUserFromGraphQLRequest(req);
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            return res.status(401).json({
                message: error.message,
                status: 401
            });
        }
        next();
    }
};

/**
 * Creates GraphQL context with authenticated user
 * @param {Object} request - GraphQL request object
 * @param {Object} params - GraphQL parameters
 * @returns {Object} GraphQL context with user
 */
const createGraphQLContext = (request, params) => {
    try {
        const user = getUserFromGraphQLRequest(request);
        return { user };
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            throw error;
        }
        // For other errors, return null user
        return { user: null };
    }
};

/**
 * Creates WebSocket context without authentication
 * @param {Object} ctx - WebSocket context
 * @returns {Object} GraphQL context with null user (no authentication required)
 */
const createWebSocketContext = (ctx) => {
    // WebSocket connections are allowed without authentication
    // All subscriptions are public and don't require tokens
    return { user: null };
};

module.exports = {
    createGraphQLContext,
    createWebSocketContext,
    getUserFromGraphQLRequest,
    extractTokenFromGraphQLRequest,
    graphqlAuthMiddleware
}; 