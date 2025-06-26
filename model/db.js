const { Sequelize } = require('sequelize');

/**
 * Database configuration and connection setup using Sequelize ORM
 * Establishes MySQL database connection with environment-based configuration
 * Provides connection testing functionality for application startup validation
 */

/**
 * Initialize Sequelize instance with MySQL database configuration
 * Uses environment variables with fallback defaults for flexible deployment
 * 
 * Environment Variables:
 * - DB_NAME: Database name (default: 'funraise')
 * - DB_USER: Database username (default: 'root')
 * - DB_PASSWORD: Database password (default: empty string)
 * - DB_HOST: Database host (default: 'localhost')
 */
const sequelize = new Sequelize(
    process.env.DB_NAME || 'funraise',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false                             // Disable SQL query logging for cleaner console output
    }
);

/**
 * Tests the database connection to ensure proper configuration
 * Should be called during application startup to validate database connectivity
 * Logs success or failure messages to help with debugging connection issues
 * 
 * @returns {Promise<void>} Resolves when connection test completes
 */
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to db successfully.');
    } catch (error) {
        console.error('Failed to connect to db:', error);
    }
};

module.exports = { sequelize, testConnection };