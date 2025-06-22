const { sequelize } = require('../model/db');

/**
 * Clears all data from the database while preserving table structure
 */
async function clearDatabase() {
    try {
        console.log('Clearing database data...');
        
        // Get all table names (excluding SequelizeMeta which stores migration info)
        const [results] = await sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME != 'SequelizeMeta'
        `);
        
        if (results.length === 0) {
            console.log('No tables found to clear');
            return;
        }

        // Disable foreign key checks temporarily
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Truncate all tables
        for (const table of results) {
            const tableName = table.TABLE_NAME;
            console.log(`Clearing table: ${tableName}`);
            await sequelize.query(`TRUNCATE TABLE \`${tableName}\``);
        }
        
        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log(`Successfully cleared ${results.length} tables`);
        
    } catch (error) {
        console.error('Error clearing database:', error);
        throw error;
    }
}

/**
 * Alternative method for PostgreSQL or other databases
 */
async function clearDatabaseAlternative() {
    try {
        console.log('Clearing database data (alternative method)...');
        
        // Get all models from Sequelize
        const models = Object.values(sequelize.models);
        
        // Clear data from all models in reverse order to handle foreign keys
        for (const model of models.reverse()) {
            console.log(`Clearing model: ${model.name}`);
            await model.destroy({ 
                where: {},
                truncate: true,
                cascade: true,
                restartIdentity: true
            });
        }
        
        console.log(`Successfully cleared ${models.length} models`);
        
    } catch (error) {
        console.error('Error clearing database (alternative method):', error);
        throw error;
    }
}

/**
 * Smart clear function that tries the best method for the current database
 */
async function smartClearDatabase() {
    try {
        // Try MySQL method first
        await clearDatabase();
    } catch (error) {
        console.warn('Primary clear method failed, trying alternative...', error.message);
        // Fallback to Sequelize method
        await clearDatabaseAlternative();
    }
}

module.exports = {
    clearDatabase,
    clearDatabaseAlternative,
    smartClearDatabase
}; 
