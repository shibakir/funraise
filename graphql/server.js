const { createHandler } = require('graphql-http/lib/use/express');
const { useServer } = require('graphql-ws/lib/use/ws');
const { WebSocketServer } = require('ws');
const schema = require('./schema');
const { createGraphQLContext, createWebSocketContext } = require('../middleware/authMiddleware');
const ApiError = require('../exception/ApiError');

/**
 * Creates a GraphQL HTTP handler
 * @returns {Function} Express middleware for handling GraphQL requests
 */
const createGraphQLHandler = () => {
    return createHandler({
        schema: schema,
        context: (request, params) => {

            try {
                return createGraphQLContext(request, params);
            } catch (error) {
                // For authorization errors, close the connection with code 4500
                if (error instanceof ApiError && error.status === 401) {
                    throw new Error('Invalid or expired token');
                }
                return {user: null};
            }
        },
        // Enable GraphiQL IDE
        graphiql: true,
        // Enable introspection for schema exploration
        introspection: true,
        // Pretty print responses
        pretty: true,
    });
};

/**
 * Sets up WebSocket server for GraphQL subscriptions
 * @param {Object} server - HTTP server instance
 * @returns {WebSocketServer} Configured WebSocket server
 */
const setupWebSocketServer = (server) => {
    // Create WebSocket server for real-time subscriptions
    const wsServer = new WebSocketServer({
        server,
        path: '/graphql',
    });
    
    // Setup GraphQL subscriptions via WebSocket
    useServer(
        {
            schema,
            onConnect: (ctx) => {
                //console.log('WebSocket client connected');
                return true;
            },
            onDisconnect: (ctx, code, reason) => {
                //console.log(`WebSocket client disconnected: ${code} ${reason}`);
            },
            context: (ctx) => {
                try {
                    return createWebSocketContext(ctx);
                } catch (error) {
                    console.error('Error creating WebSocket context:', error);
                    // Return context with null user instead of throwing error
                    return { user: null };
                }
            },
        },
        wsServer
    );
    
    return wsServer;
};

module.exports = {
    createGraphQLHandler,
    setupWebSocketServer,
}; 