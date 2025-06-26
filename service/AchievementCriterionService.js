const ApiError = require('../exception/ApiError');
const { AchievementCriterionRepository } = require('../repository');

/**
 * Service layer for managing achievement criteria and requirements
 * Handles the specific conditions that must be met to unlock achievements
 * Manages criterion creation, validation, and type-based retrieval
 */
class AchievementCriterionService {

    /**
     * Creates a new achievement criterion with type and value validation
     * Defines specific requirements that users must meet for achievement completion
     * @param {Object} data - Criterion creation data
     * @param {string} data.type - Type of criterion (e.g., 'EVENT_PARTICIPATION', 'DEPOSIT_AMOUNT')
     * @param {number} data.value - Target value that must be reached for completion
     * @returns {Promise<AchievementCriterion>} Created criterion object
     * @throws {ApiError} Bad request if creation fails or validation errors occur
     */
    async create(data) {
        try {
            const { type, value } = data;

            const achievementCriterion = await AchievementCriterionRepository.create({
                type: type,
                value: value
            });

            return achievementCriterion;
        } catch (e) {
            throw ApiError.badRequest('Error creating achievement', e.message);
        }
    }

    /**
     * Finds all criteria of a specific type with their associated achievements
     * Used for achievement tracking and progress calculation by criterion type
     * @param {string} criterionType - Type of criterion to search for
     * @returns {Promise<AchievementCriterion[]>} Array of criteria with achievement details
     * @throws {ApiError} Bad request if operation fails
     */
    async findByType(criterionType) {
        try {
            return await AchievementCriterionRepository.findByType(criterionType);
        } catch (e) {
            throw ApiError.badRequest('Error finding criteria by type', e.message);
        }
    }

    /**
     * Finds a specific achievement criterion by its ID
     * Used for criterion validation and detailed criterion information
     * @param {number} criterionId - ID of the criterion to find
     * @returns {Promise<AchievementCriterion>} Criterion object
     * @throws {ApiError} Database error if criterion not found or operation fails
     */
    async findById(criterionId) {
        try {
            return await AchievementCriterionRepository.findByPk(criterionId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding achievement criterion by ID', e);
        }
    }

}

module.exports = new AchievementCriterionService();