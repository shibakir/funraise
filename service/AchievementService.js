const ApiError = require('../exception/ApiError');
const { AchievementRepository } = require('../repository');

/**
 * Service layer for managing achievements and their definitions
 * Handles achievement creation, retrieval, and validation of achievement criteria
 * Manages the master list of achievements available in the system
 */
class AchievementService {

    /**
     * Creates a new achievement with validation
     * Ensures achievement has required completion criteria before creation
     * @param {Object} data - Achievement creation data
     * @param {string} data.name - Name/title of the achievement
     * @param {string} data.iconUrl - URL of the achievement icon/badge
     * @param {Array} data.conditions - Array of conditions required for completion
     * @returns {Promise<Achievement>} Created achievement object
     * @throws {ApiError} Business logic error if no conditions provided, database error if creation fails
     */
    async create(data) {
        try {
            const { name, iconUrl, conditions } = data;

            // Validate that achievement has at least one completion condition
            if ( conditions.length === 0 ) {
                throw ApiError.businessLogic('At least one condition is required');
            }

            const achievement = await AchievementRepository.create({
                name: name,
                iconUrl: iconUrl,
            });

            return achievement;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error creating achievement', e);
        }
    }

    /**
     * Retrieves all achievements with their associated criteria
     * Used for achievement system initialization and complete achievement listing
     * @returns {Promise<Achievement[]>} Array of achievements with their completion criteria
     * @throws {ApiError} Database error if operation fails
     */
    async getAllWithCriteria() {
        try {
            return await AchievementRepository.findAllWithCriteria();
        } catch (e) {
            throw ApiError.database('Error getting achievements with criteria', e);
        }
    }

    /**
     * Finds a specific achievement by its ID
     * Used for achievement validation and detail retrieval
     * @param {number} achievementId - ID of the achievement to find
     * @returns {Promise<Achievement>} Achievement object
     * @throws {ApiError} Database error if achievement not found or operation fails
     */
    async findById(achievementId) {
        try {
            return await AchievementRepository.findByPk(achievementId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding achievement by ID', e);
        }
    }
}

module.exports = new AchievementService();