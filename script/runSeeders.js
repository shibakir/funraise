#!/usr/bin/env node

/**
 * Script to run seeders from the command line
 * 
 * Usage:
 *   node script/runSeeders.js                    - run all seeders
 *   node script/runSeeders.js achievements       - only achievements
 *   node script/runSeeders.js testdata           - only test data
 *   node script/runSeeders.js production         - production data
 *   node script/runSeeders.js clear              - only clear database
 */

require('dotenv').config();

const { 
    runAllSeeders, 
    seedAchievements, 
    seedTestData, 
    seedProductionData,
    smartClearDatabase
} = require('../seeder');

async function main() {
    const command = process.argv[2] || 'all';

    try {
        console.log(`Running seeder command: ${command}`);
        
        switch (command.toLowerCase()) {
            case 'clear':
                console.log('Clearing database...');
                await smartClearDatabase();
                break;
                
            case 'achievements':
            case 'achievement':
                console.log('Running achievements seeder...');
                await seedAchievements();
                break;
                
            case 'testdata':
            case 'test':
                console.log('Running test data seeder...');
                await seedTestData();
                break;
                
            case 'production':
            case 'prod':
                console.log('Running production seeders...');
                await seedProductionData();
                break;
                
            case 'all':
            default:
                console.log('Running all seeders...');
                await runAllSeeders();
                break;
        }
        
        console.log('Seeder completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('Seeder failed:', error);
        process.exit(1);
    }
}

// Run only if the file is called directly
if (require.main === module) {
    main();
}

module.exports = main; 