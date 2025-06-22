const { 
    userAchievementService, 
    achievementService, 
    userCriterionProgressService, 
    achievementCriterionService 
} = require('../../../service');

const achievementResolvers = {
    Query: {
        userAchievements: async (_, { userId }) => {
            try {
                return await userAchievementService.findByUserWithDetails(userId);
            } catch (error) {
                console.error('Error fetching user achievements:', error);
                return [];
            }
        }
    },
    UserAchievement: {
        achievement: async (userAchievement) => {
            if (userAchievement.achievement) return userAchievement.achievement;
            
            try {
                return await achievementService.findById(userAchievement.achievementId);
            } catch (error) {
                console.error('Error fetching achievement:', error);
                return null;
            }
        },
        progress: async (userAchievement) => {
            if (userAchievement.progresses) {
                return userAchievement.progresses.map(progress => ({
                    ...progress.toJSON(),
                    isCompleted: progress.completed
                }));
            }
            
            try {
                const progresses = await userCriterionProgressService.findByUserAchievementWithCriteria(userAchievement.id);
                return progresses.map(progress => ({
                    ...progress.toJSON(),
                    isCompleted: progress.completed
                }));
            } catch (error) {
                console.error('Error fetching progress:', error);
                return [];
            }
        }
    },
    UserCriterionProgress: {
        criterion: async (progress) => {
            if (progress.criterion) return progress.criterion;
            
            try {
                return await achievementCriterionService.findById(progress.criterionId);
            } catch (error) {
                console.error('Error fetching criterion:', error);
                return null;
            }
        }
    },
    AchievementCriterion: {
        criteriaType: (criterion) => criterion.type,
        criteriaValue: (criterion) => criterion.value,
        description: (criterion) => `${criterion.type} criterion with value ${criterion.value}`
    }
};

module.exports = achievementResolvers; 