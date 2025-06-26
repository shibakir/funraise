const BaseRepository = require('./BaseRepository');
const { UserAchievement, Achievement, UserCriterionProgress, AchievementCriterion } = require('../model');

/**
 * Repository for managing user achievement tracking and progress
 * Handles the relationship between users and their achievement completion status
 */
class UserAchievementRepository extends BaseRepository {
    /**
     * Initializes the UserAchievement repository with the UserAchievement model
     */
    constructor() {
        super(UserAchievement);
    }

    /**
     * Finds a specific user's progress on a specific achievement
     * Used to check if user already has an achievement record and get current status
     * @param {number} userId - ID of the user
     * @param {number} achievementId - ID of the achievement
     * @returns {Promise<UserAchievement|null>} User achievement record or null if not found
     */
    async findByUserAndAchievement(userId, achievementId) {
        return await this.findOne({
            where: {
                userId,
                achievementId
            }
        });
    }

    /**
     * Finds all achievements for a user with complete progress details
     * Used for user achievement display with full progress information
     * @param {number} userId - ID of the user
     * @returns {Promise<UserAchievement[]>} Array of user achievements with criteria progress
     */
    async findByUserWithDetails(userId) {
        return await this.findAll({
            where: { userId },
            include: [
                {
                    model: Achievement,
                    as: 'achievement'
                },
                {
                    model: UserCriterionProgress,
                    as: 'progresses',
                    include: [{
                        model: AchievementCriterion,
                        as: 'criterion'
                    }]
                }
            ]
        });
    }

    /**
     * Updates the completion status and unlock timestamp of a user achievement
     * Used when a user completes all criteria and unlocks an achievement
     * @param {number} userAchievementId - ID of the user achievement record
     * @param {string} status - New achievement status (e.g., 'UNLOCKED', 'IN_PROGRESS')
     * @param {Date|null} unlockedAt - Timestamp when achievement was unlocked (null if not unlocked)
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if user achievement doesn't exist or database error
     */
    async updateStatus(userAchievementId, status, unlockedAt = null) {
        return await this.update(userAchievementId, {
            status,
            unlockedAt
        });
    }
}

module.exports = new UserAchievementRepository(); 