const { sequelize, testConnection } = require('../model/db');
const seedAchievements = require('../seeder/seedAchievements');
const seedTestData = require('../seeder/seedTestData');

const resetDatabase = async () => {
    try {
        console.log('Testing database connection...');
        await testConnection();
        
        console.log('Dropping all tables...');
        
        // Temporarily disable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Drop all tables
        await sequelize.drop();
        
        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('All tables dropped successfully');
        
        console.log('Syncing database...');
        await sequelize.sync({ force: true });
        console.log('Database synced successfully');
        console.log('');

        console.log('Seeding achievements...');
        await seedAchievements();
        console.log('Achievements seeded successfully');
        /*
        console.log('Seeding test data...');
        await seedTestData();
        console.log('Test data seeded successfully');
        */

        console.log('Database reset completed successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        // Ensure foreign key checks are re-enabled even if there's an error
        try {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (fkError) {
            console.error('Error re-enabling foreign key checks:', fkError);
        }
        process.exit(1);
    }
};

resetDatabase(); 