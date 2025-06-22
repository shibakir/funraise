const { Achievement, AchievementCriterion } = require('../model');

async function seedAchievements() {
    try {
        console.log('Seeding achievements...');

        // ############################################################
        // 1. Achievement "First Steps"
        const firstStepsAchievement = await Achievement.create({
            name: 'FIRST_STEPS_1',
            iconUrl: '🚀'
        });

        await AchievementCriterion.create({
            achievementId: firstStepsAchievement.id,
            type: 'EVENT_COUNT_CREATED',
            value: 1
        });
        await AchievementCriterion.create({
            achievementId: firstStepsAchievement.id,
            type: 'USER_BANK',
            value: 5
        });

        // ############################################################
        // 2. Achievement "Banker" 1
        const bankerAchievement = await Achievement.create({
            name: 'BANKER_1',
            iconUrl: '💰'
        });

        await AchievementCriterion.create({
            achievementId: bankerAchievement.id,
            type: 'USER_BANK',
            value: 50
        });

        // ############################################################
        // 3. Achievement "Banker" 2
        const bankerSecondAchievement = await Achievement.create({
            name: 'BANKER_2',
            iconUrl: '🏦'
        });

        await AchievementCriterion.create({
            achievementId: bankerSecondAchievement.id,
            type: 'USER_BANK',
            value: 100
        });

        // ############################################################
        // 4. Achievement "Banker" 3
        const bankerThirdAchievement = await Achievement.create({
            name: 'BANKER_3',
            iconUrl: '💎'
        });

        await AchievementCriterion.create({
            achievementId: bankerThirdAchievement.id,
            type: 'USER_BANK',
            value: 500
        });

        // ############################################################
        // 5. Achievement "Active Participant" 1
        const activeParticipantAchievementFirst = await Achievement.create({
            name: 'ACTIVE_PARTICIPANT_1',
            iconUrl: '⭐'
        });

        await AchievementCriterion.create({
            achievementId: activeParticipantAchievementFirst.id,
            type: 'EVENT_COUNT_CREATED',
            value: 2
        });
        await AchievementCriterion.create({
            achievementId: activeParticipantAchievementFirst.id,
            type: 'EVENT_COUNT_COMPLETED',
            value: 5
        });

        // ############################################################
        // 5. Achievement "Active Participant" 2
        const activeParticipantAchievementSecond = await Achievement.create({
            name: 'ACTIVE_PARTICIPANT_2',
            iconUrl: '🌟'
        });

        await AchievementCriterion.create({
            achievementId: activeParticipantAchievementSecond.id,
            type: 'EVENT_COUNT_CREATED',
            value: 5
        });
        await AchievementCriterion.create({
            achievementId: activeParticipantAchievementSecond.id,
            type: 'EVENT_COUNT_COMPLETED',
            value: 10
        });

        console.log('Achievements successfully created!');

    } catch (error) {
        console.error('Error creating achievements:', error);
        throw error;
    }
}

module.exports = seedAchievements;
