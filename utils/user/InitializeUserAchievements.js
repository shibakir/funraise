const userService = require('../../service/UserService');
const { initializeUser } = require('../achievement');

async function initializeUserAchievements(data) {
    console.log('Initialize user achievements...');
    try {
        const { userId } = data;

        // Check if user exists using service
        const user = await userService.findById(userId, false);
        if (!user) {
            throw new Error('User not found');
        }

        // Use the achievement tracker to initialize user achievements
        await initializeUser(userId);

        console.log(`Successfully initialized achievements for user ${userId}`);

    } catch (error) {
        console.error('Error initializing user achievements:', error);
        throw error;
    }
}

module.exports = initializeUserAchievements;
