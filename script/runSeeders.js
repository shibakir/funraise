#!/usr/bin/env node

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
            case 'testdata':
            case 'test':
                console.log('Running test data seeder...');
                await seedTestData();
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