const achievementService = require('../../service/AchievementService');
const userAchievementService = require('../../service/UserAchievementService');
const userCriterionProgressService = require('../../service/UserCriterionProgressService');
const achievementCriterionService = require('../../service/AchievementCriterionService');

/**
 * Main class for tracking and updating user achievement progress
 */
class AchievementTracker {
    
    /**
     * Initialize achievements for a user
     * @param {number} userId - User ID
     */
    async initializeUserAchievements(userId) {
        try {
            // Get all achievements
            const achievements = await achievementService.getAllWithCriteria();

            for (const achievement of achievements) {

                // Check if there is already a record for this achievement for the user
                let userAchievement = await userAchievementService.findByUserAndAchievement(
                    userId, 
                    achievement.id
                );

                if (!userAchievement) {
                    // Create a record for the user's achievement
                    userAchievement = await userAchievementService.create({
                        userId: userId,
                        achievementId: achievement.id
                    });
                }

                // Create progress records for each criterion
                for (const criterion of achievement.criteria) {
                    const existingProgress = await userCriterionProgressService.findByUserAchievementAndCriterion(
                        userAchievement.id,
                        criterion.id
                    );

                    if (!existingProgress) {
                        await userCriterionProgressService.createProgress(
                            userAchievement.id,
                            criterion.id,
                            0,
                            false
                        );
                    }
                }
            }
        } catch (error) {
            //console.error('Error initializing user achievements:', error);
            throw error;
        }
    }

    /**
     * Update progress for a user's criterion
     * @param {number} userId - User ID
     * @param {string} criterionType - Criterion type
     * @param {number} value - Value for updating
     * @param {Object} options - Дополнительные параметры
     */
    async updateProgress(userId, criterionType, value = 1, options = {}) {
        try {
            // Find all criteria of this type
            const criteria = await achievementCriterionService.findByType(criterionType);
            
            //console.log(`Updating progress for user ${userId}, criterion ${criterionType}, value ${value}, found ${criteria.length} criteria`);

            for (const criterion of criteria) {
                // Find the user's achievement
                const userAchievement = await userAchievementService.findByUserAndAchievement(
                    userId,
                    criterion.achievementId
                );

                if (!userAchievement || userAchievement.status) {
                    //console.log(`Skipping criterion ${criterion.id} - achievement already obtained or not found`);
                    continue; // Skip if the achievement is already obtained
                }

                // Find the criterion's progress
                let progress = await userCriterionProgressService.findByUserAchievementAndCriterion(
                    userAchievement.id,
                    criterion.id
                );

                if (!progress) {
                    progress = await userCriterionProgressService.createProgress(
                        userAchievement.id,
                        criterion.id,
                        0,
                        false
                    );
                    //console.log(`Created new progress for criterion ${criterion.id}`);
                }

                if (progress.completed) {
                    //console.log(`Skipping criterion ${criterion.id} - already completed`);
                    continue; // Criterion is already completed
                }

                // Update the value depending on the operation type
                const updateType = options.updateType || 'increment';
                let newValue = progress.currentValue;
                const oldValue = newValue;

                switch (updateType) {
                    case 'increment':
                        newValue += value;
                        break;
                    case 'set':
                        newValue = value;
                        break;
                    case 'max':
                        newValue = Math.max(progress.currentValue, value);
                        break;
                    default:
                        newValue += value;
                }

                // Check if the criterion is completed
                const isCompleted = newValue >= criterion.value;

                //console.log(`Criterion ${criterion.id} (${criterionType}): ${oldValue} -> ${newValue}/${criterion.value} ${isCompleted ? 'COMPLETED!' : ''}`);

                // Update the progress
                await userCriterionProgressService.updateProgress(
                    progress.id,
                    newValue,
                    isCompleted,
                    isCompleted ? new Date() : null
                );

                // If the criterion is completed, check the achievement
                if (isCompleted) {
                    //console.log(`Checking achievement completion for criterion ${criterion.id}`);
                    await this.checkAchievementCompletion(userAchievement.id);
                }
            }
        } catch (error) {
            console.error('Error updating achievement progress:', error);
            throw error;
        }
    }

    /**
     * Check if the achievement is completed
     * @param {number} userAchievementId - User achievement ID
     */
    async checkAchievementCompletion(userAchievementId) {
        try {
            const userAchievement = await userAchievementService.findById(userAchievementId);
            if (!userAchievement || userAchievement.status) {
                return; // Achievement is already obtained
            }

            // Check all achievement criteria
            const progressRecords = await userCriterionProgressService.findByUserAchievement(userAchievementId);

            const allCompleted = progressRecords.every(progress => progress.completed);

            if (allCompleted && progressRecords.length > 0) {
                await userAchievementService.updateStatus(
                    userAchievementId,
                    true,
                    new Date()
                );

                //console.log(`Achievement ${userAchievement.achievementId} obtained by user ${userAchievement.userId}`);
                
                // Here you can add notifications to the user
                await this.onAchievementUnlocked(userAchievement);
            }
        } catch (error) {
            //console.error('Error checking achievement completion:', error);
            throw error;
        }
    }

    /**
     * Called when an achievement is obtained
     * @param {Object} userAchievement - User achievement
     */
    async onAchievementUnlocked(userAchievement) {
        // Here you can add logic for notifications, rewards, etc.
        //console.log(`User ${userAchievement.userId} obtained an achievement!`);
    }

    /**
     * Get all achievements for a user with progress
     * @param {number} userId - User ID
     */
    async getUserAchievements(userId) {
        try {
            return await userAchievementService.findByUserWithDetails(userId);
        } catch (error) {
            //console.error('Error getting user achievements:', error);
            throw error;
        }
    }
}

module.exports = AchievementTracker; 