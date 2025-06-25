const ApiError = require('../exception/ApiError');
const { UserCriterionProgressRepository, UserRepository, AchievementCriterionRepository } = require('../repository');

/**
 * Service layer for managing individual achievement criterion progress tracking
 * Handles detailed progress on specific criteria within achievements (e.g., event count, deposit amounts)
 * Manages criterion completion status and progress value updates
 */
class UserCriterionProgressService {

    /**
     * Creates a new user criterion progress tracking record
     * Note: This method appears to have incorrect parameter names and should be refactored
     * @param {Object} data - Progress tracking data
     * @param {number} data.userId - ID of the user
     * @param {number} data.achievementId - ID of the achievement criterion (misnamed parameter)
     * @returns {Promise<UserCriterionProgress>} Created progress tracking record
     * @throws {ApiError} Bad request if user or criterion doesn't exist
     * @deprecated This method has incorrect parameter naming and should be updated
     */
    async create(data) {
        try {
            const { userId, achievementId } = data;

            // Validate that user exists before creating progress tracking
            const user = await UserRepository.findByPk(userId);
            if (!user) {
                throw Error('User does not exist');
            }

            const achievementCriterion = await AchievementCriterionRepository.findByPk(achievementId);
            if (!achievementCriterion) {
                throw Error('Achievement Criterion does not exist');
            }

            const userCriterionProgress = await UserCriterionProgressRepository.create({
                userId: userId,
                achievementId: achievementId,
            });

            return userCriterionProgress;
        } catch (e) {
            throw ApiError.badRequest('Error creating user achievement', e.message);
        }
    }

    /**
     * Finds progress for a specific criterion within a user achievement
     * Used to get current progress on individual achievement requirements
     * @param {number} userAchievementId - ID of the user achievement record
     * @param {number} criterionId - ID of the specific criterion
     * @returns {Promise<UserCriterionProgress|null>} Progress record or null if not found
     * @throws {ApiError} Bad request if operation fails
     */
    async findByUserAchievementAndCriterion(userAchievementId, criterionId) {
        try {
            return await UserCriterionProgressRepository.findByUserAchievementAndCriterion(userAchievementId, criterionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding user criterion progress', e.message);
        }
    }

    /**
     * Finds all progress records for a specific user achievement
     * Used to get complete progress overview for an achievement
     * @param {number} userAchievementId - ID of the user achievement record
     * @returns {Promise<UserCriterionProgress[]>} Array of progress records for all criteria
     * @throws {ApiError} Bad request if operation fails
     */
    async findByUserAchievement(userAchievementId) {
        try {
            return await UserCriterionProgressRepository.findByUserAchievement(userAchievementId);
        } catch (e) {
            throw ApiError.badRequest('Error finding progress by user achievement', e.message);
        }
    }

    /**
     * Finds all progress records for a user achievement with criterion details
     * Used for detailed achievement progress display with criterion information
     * @param {number} userAchievementId - ID of the user achievement record
     * @returns {Promise<UserCriterionProgress[]>} Array of progress records with criterion details
     * @throws {ApiError} Bad request if operation fails
     */
    async findByUserAchievementWithCriteria(userAchievementId) {
        try {
            return await UserCriterionProgressRepository.findByUserAchievementWithCriteria(userAchievementId);
        } catch (e) {
            throw ApiError.badRequest('Error finding progress with criteria by user achievement', e.message);
        }
    }

    /**
     * Creates a new progress record for a user achievement criterion
     * Used when initializing achievement tracking for a user
     * @param {number} userAchievementId - ID of the user achievement record
     * @param {number} criterionId - ID of the criterion to track
     * @param {number} currentValue - Initial progress value (default: 0)
     * @param {boolean} completed - Whether criterion is already completed (default: false)
     * @returns {Promise<UserCriterionProgress>} Created progress record
     * @throws {ApiError} Bad request if creation fails
     */
    async createProgress(userAchievementId, criterionId, currentValue = 0, completed = false) {
        try {
            return await UserCriterionProgressRepository.createProgress(userAchievementId, criterionId, currentValue, completed);
        } catch (e) {
            throw ApiError.badRequest('Error creating user criterion progress', e.message);
        }
    }

    /**
     * Updates progress value and completion status for a criterion
     * Used when user actions increment progress toward achievement completion
     * @param {number} progressId - ID of the progress record to update
     * @param {number} currentValue - New progress value
     * @param {boolean} completed - Whether criterion is now completed
     * @param {Date|null} completedAt - Timestamp when criterion was completed (null if not completed)
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Bad request if update fails
     */
    async updateProgress(progressId, currentValue, completed, completedAt = null) {
        try {
            return await UserCriterionProgressRepository.updateProgress(progressId, currentValue, completed, completedAt);
        } catch (e) {
            throw ApiError.badRequest('Error updating user criterion progress', e.message);
        }
    }

}

module.exports = new UserCriterionProgressService();