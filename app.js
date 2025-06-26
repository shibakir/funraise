require('dotenv').config()
const express = require('express');
const { createServer } = require('http');
const cron = require('node-cron');
const errorMiddleware = require('./middleware/ErrorMiddleware');
const { graphqlAuthMiddleware } = require('./middleware/authMiddleware');
const { syncDatabase } = require('./model');
const { eventService } = require('./service');
const { createGraphQLHandler, setupWebSocketServer } = require('./graphql/server');
const authRoutes = require('./routes/authRoutes');

// Use environment variables for server configuration
const PORT = process.env.FUNRAISE_APP_PORT || 3000;
const APP_URL = process.env.FUNRAISE_APP_URL || `http://localhost:${PORT}`;

const app = express();

// Middleware setup
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// HTTP GraphQL endpoint with auth middleware
app.use('/graphql', graphqlAuthMiddleware, createGraphQLHandler());

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'funraise-api'
    });
});

// Auth routes (only email activation)
app.use('/', authRoutes);

// Discord OAuth callback handler
app.get('/auth/discord/callback', (req, res) => {
    const { code, state } = req.query;

    if (code) {
        // redirect back on mobile
        const redirectUrl = `funraise://auth/discord/callback?code=${code}${state ? `&state=${state}` : ''}`;
        res.redirect(redirectUrl);
    } else {
        res.status(400).json({ error: 'No authorization code provided' });
    }
});

// Error handling middleware
app.use(errorMiddleware);

/**
 * Initializes and starts the FunRaise GraphQL server
 * Sets up database connection, HTTP server, WebSocket server, and cron jobs
 */
const start = async () => {
    try {
        // Initialize database
        console.log('Initializing database...');
        await syncDatabase();
        console.log('Database synchronized successfully');

        // Always clear database and run seeders
        console.log('Clearing database and running seeders...');
        const { runAllSeeders, seedProductionData, smartClearDatabase } = require('./seeder');
        
        // Clear all data
        await smartClearDatabase();
        console.log('Database cleared');

        // Run seeders with some test data & achievements
        await runAllSeeders();
    
        // Create HTTP server
        const server = createServer(app);
        
        // Setup WebSocket server for GraphQL subscriptions
        console.log('Setting up WebSocket server...');
        setupWebSocketServer(server);
        console.log('WebSocket server configured');
        
        // Start the server
        server.listen(PORT, () => {
            console.log(`Server started at ${APP_URL}/graphql`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Port: ${PORT}`);

            // Setup cron job for checking time conditions every minute
            cron.schedule('* * * * *', async () => {
                try {
                    await eventService.checkTimeConditions();
                } catch (error) {
                    console.error('Error in cron job for time conditions:', error);
                }
            });
            //console.log('Cron job for time conditions is active (runs every minute)');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
