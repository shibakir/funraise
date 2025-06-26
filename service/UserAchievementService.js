const ApiError = require('../exception/ApiError');
const { UserAchievementRepository, UserRepository, AchievementRepository } = require('../repository');

/**
 * Service layer for managing user achievement tracking and progress
 * Handles the relationship between users and their achievement completion status
 * Manages achievement unlocking, progress tracking, and status updates
 */
class UserAchievementService {

    /**
     * Creates a new user achievement tracking record
     * Establishes tracking for a user's progress on a specific achievement
     * @param {Object} data - User achievement data
     * @param {number} data.userId - ID of the user
     * @param {number} data.achievementId - ID of the achievement to track
     * @returns {Promise<UserAchievement>} Created user achievement record
     * @throws {ApiError} Not found if user/achievement doesn't exist, conflict if already exists
     */
    async create(data) {
        try {
            const { userId, achievementId } = data;

            // Validate that user exists before creating achievement tracking
            const user = await UserRepository.findByPk(userId);
            if(!user) {
                throw ApiError.notFound('User does not exist');
            }

            // Validate that achievement exists before creating tracking
            const achievement = await AchievementRepository.findByPk(achievementId);
            if (!achievement) {
                throw ApiError.notFound('Achievement does not exist');
            }

            // Prevent duplicate achievement tracking for the same user
            const existingUserAchievement = await this.findByUserAndAchievement(userId, achievementId);
            if (existingUserAchievement) {
                throw ApiError.conflict('User already has this achievement');
            }

            const userAchievement = await UserAchievementRepository.create({
                userId: userId,
                achievementId: achievementId,
            });

            return userAchievement;
        } catch (e) {
            // If it's an ApiError, just throw it
            if (e instanceof ApiError) {
                throw e;
            }
            // Otherwise wrap in database error
            throw ApiError.database('Error creating user achievement', e);
        }
    }

    /**
     * Finds a specific user's progress on a specific achievement
     * Used to check if user already has an achievement record and get current status
     * @param {number} userId - ID of the user
     * @param {number} achievementId - ID of the achievement
     * @returns {Promise<UserAchievement|null>} User achievement record or null if not found
     * @throws {ApiError} Database error if operation fails
     */
    async findByUserAndAchievement(userId, achievementId) {
        try {
            return await UserAchievementRepository.findByUserAndAchievement(userId, achievementId);
        } catch (e) {
            throw ApiError.database('Error finding user achievement', e);
        }
    }

    /**
     * Finds a user achievement by its ID
     * Used for direct achievement record access and validation
     * @param {number} userAchievementId - ID of the user achievement record
     * @returns {Promise<UserAchievement>} User achievement record
     * @throws {ApiError} Database error if user achievement not found
     */
    async findById(userAchievementId) {
        try {
            return await UserAchievementRepository.findByPk(userAchievementId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding user achievement by ID', e);
        }
    }

    /**
     * Finds all achievements for a user with complete progress details
     * Used for user achievement display with full progress information
     * @param {number} userId - ID of the user
     * @returns {Promise<UserAchievement[]>} Array of user achievements with criteria progress
     * @throws {ApiError} Database error if operation fails
     */
    async findByUserWithDetails(userId) {
        try {
            return await UserAchievementRepository.findByUserWithDetails(userId);
        } catch (e) {
            throw ApiError.database('Error getting user achievements with details', e);
        }
    }

    /**
     * Updates the completion status and unlock timestamp of a user achievement
     * Used when a user completes all criteria and unlocks an achievement
     * Includes business logic validation to prevent redundant status changes
     * @param {number} userAchievementId - ID of the user achievement record
     * @param {string} status - New achievement status (e.g., 'UNLOCKED', 'IN_PROGRESS')
     * @param {Date|null} unlockedAt - Timestamp when achievement was unlocked (null if not unlocked)
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Business logic error if status is already set, database error if update fails
     */
    async updateStatus(userAchievementId, status, unlockedAt = null) {
        try {
            const userAchievement = await this.findById(userAchievementId);
            
            // Prevent redundant status updates to maintain data integrity
            if (status === userAchievement.status) {
                throw ApiError.businessLogic('Achievement status is already set to this value');
            }

            return await UserAchievementRepository.updateStatus(userAchievementId, status, unlockedAt);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error updating user achievement status', e);
        }
    }

}

module.exports = new UserAchievementService();