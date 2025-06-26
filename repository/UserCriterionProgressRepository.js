const BaseRepository = require('./BaseRepository');
const { UserCriterionProgress, AchievementCriterion } = require('../model');

/**
 * Repository for managing individual achievement criterion progress tracking
 * Handles detailed progress on specific criteria within achievements (e.g., event count, deposit amounts)
 */
class UserCriterionProgressRepository extends BaseRepository {
    /**
     * Initializes the UserCriterionProgress repository with the UserCriterionProgress model
     */
    constructor() {
        super(UserCriterionProgress);
    }

    /**
     * Finds progress for a specific criterion within a user achievement
     * Used to get current progress on individual achievement requirements
     * @param {number} userAchievementId - ID of the user achievement record
     * @param {number} criterionId - ID of the specific criterion
     * @returns {Promise<UserCriterionProgress|null>} Progress record or null if not found
     */
    async findByUserAchievementAndCriterion(userAchievementId, criterionId) {
        return await this.findOne({
            where: {
                userAchievementId,
                criterionId
            }
        });
    }

    /**
     * Finds all progress records for a specific user achievement
     * Used to get complete progress overview for an achievement
     * @param {number} userAchievementId - ID of the user achievement record
     * @returns {Promise<UserCriterionProgress[]>} Array of progress records for all criteria
     */
    async findByUserAchievement(userAchievementId) {
        return await this.findAll({
            where: { userAchievementId }
        });
    }

    /**
     * Finds all progress records for a user achievement with criterion details
     * Used for detailed achievement progress display with criterion information
     * @param {number} userAchievementId - ID of the user achievement record
     * @returns {Promise<UserCriterionProgress[]>} Array of progress records with criterion details
     */
    async findByUserAchievementWithCriteria(userAchievementId) {
        return await this.findAll({
            where: { userAchievementId },
            include: [{
                model: AchievementCriterion,
                as: 'criterion'
            }]
        });
    }

    /**
     * Creates a new progress record for a user achievement criterion
     * Used when initializing achievement tracking for a user
     * @param {number} userAchievementId - ID of the user achievement record
     * @param {number} criterionId - ID of the criterion to track
     * @param {number} currentValue - Initial progress value (default: 0)
     * @param {boolean} completed - Whether criterion is already completed (default: false)
     * @returns {Promise<UserCriterionProgress>} Created progress record
     * @throws {ApiError} Database error if creation fails
     */
    async createProgress(userAchievementId, criterionId, currentValue = 0, completed = false) {
        return await this.create({
            userAchievementId,
            criterionId,
            currentValue,
            completed
        });
    }

    /**
     * Updates progress value and completion status for a criterion
     * Used when user actions increment progress toward achievement completion
     * @param {number} progressId - ID of the progress record to update
     * @param {number} currentValue - New progress value
     * @param {boolean} completed - Whether criterion is now completed
     * @param {Date|null} completedAt - Timestamp when criterion was completed (null if not completed)
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if progress record doesn't exist or database error
     */
    async updateProgress(progressId, currentValue, completed, completedAt = null) {
        return await this.update(progressId, {
            currentValue,
            completed,
            completedAt
        });
    }
}

module.exports = new UserCriterionProgressRepository(); 