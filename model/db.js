const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'funraise',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to db successfully.');
    } catch (error) {
        console.error('Failed to connect to db:', error);
    }
};

module.exports = { sequelize, testConnection };