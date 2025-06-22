const { syncDatabase } = require('../model');
const seedAchievements = require('./seedAchievements');
const seedTestData = require('./seedTestData');
const { smartClearDatabase } = require('./clearDatabase');

/**
 * Main seeder that runs all seeders in the correct order
 */
async function runAllSeeders() {
    try {
        console.log('Starting database seeding...');

        // 1. Seed achievements (they are needed for users)
        console.log('Seeding achievements...');
        await seedAchievements();
        console.log('Achievements seeded');

        // 2. Seed test data (users, events)
        console.log('Seeding test data...');
        await seedTestData();
        console.log('Test data seeded');

        console.log('All seeders completed successfully!');
        return true;
    } catch (error) {
        console.error('Error running seeders:', error);
        throw error;
    }
}

/**
 * Runs only achievements (for production)
 */
async function seedProductionData() {
    try {
        console.log('Starting production data seeding...');

        console.log('Seeding achievements...');
        await seedAchievements();
        console.log('Achievements seeded');

        console.log('Production data seeded successfully!');
        return true;
    } catch (error) {
        console.error('Error seeding production data:', error);
        throw error;
    }
}



module.exports = {
    runAllSeeders,
    seedProductionData,
    seedAchievements,
    seedTestData,
    smartClearDatabase
}; 