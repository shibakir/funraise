const { User, Achievement, AchievementCriterion, UserAchievement, UserCriterionProgress } = require('../../model');

async function initializeUserAchievements(data) {
    console.log('Initialize user achievements...');
    try {

        const { userId } = data;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        // Get all achievements
        const achievements = await Achievement.findAll({
            include: [{
                model: AchievementCriterion
            }]
        });

        if (achievements.length === 0) {
            console.log('No achievements found in the system');
            return;
        }

        console.log(`Found ${achievements.length} achievements to initialize for user ${userId}`);

        // Create user achievement records
        for (const achievement of achievements) {
            // Check if the record already exists for this user and achievement
            const existingUserAchievement = await UserAchievement.findOne({
                where: {
                    userId: userId,
                    achievementId: achievement.id
                }
            });

            if (existingUserAchievement) {
                console.log(`User achievement already exists for achievement ${achievement.name}`);
                continue;
            }

            // Create user achievement record
            const userAchievement = await UserAchievement.create({
                userId: userId,
                achievementId: achievement.id,
                status: false
            });

            console.log(`Created user achievement for: ${achievement.name}`);

            // Get criteria for this achievement
            const criteria = await AchievementCriterion.findAll({
                where: { achievementId: achievement.id }
            });

            // Create progress records for each criterion
            for (const criterion of criteria) {
                const existingProgress = await UserCriterionProgress.findOne({
                    where: {
                        userAchievementId: userAchievement.id,
                        criterionId: criterion.id
                    }
                });

                if (existingProgress) {
                    console.log(`Progress already exists for criterion ${criterion.type}`);
                    continue;
                }

                await UserCriterionProgress.create({
                    userAchievementId: userAchievement.id,
                    criterionId: criterion.id,
                    currentValue: 0,
                    completed: false
                });

                console.log(`Created progress for criterion: ${criterion.type} (target: ${criterion.value})`);
            }
        }

        console.log(`Successfully initialized achievements for user ${userId}`);

    } catch (error) {
        console.error('Error initializing user achievements:', error);
        throw error;
    }
}

module.exports = initializeUserAchievements;
