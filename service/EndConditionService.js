const ApiError = require('../exception/ApiError');
const { EndConditionRepository } = require('../repository');
const Joi = require("joi");

/**
 * Service layer for managing individual event end conditions
 * Handles specific conditions within condition groups (e.g., time limits, participant counts, deposit amounts)
 * Manages condition creation, status updates, and validation
 */
class EndConditionService {

    /**
     * Creates a new individual end condition within a condition group
     * Defines specific criteria that must be met for event completion
     * @param {Object} data - End condition creation data
     * @param {string} data.name - Name/type of the condition (e.g., 'TIME', 'PARTICIPANTS', 'DEPOSIT')
     * @param {string} data.operator - Comparison operator ('>=', '<=', '==', etc.)
     * @param {number} data.value - Target value for the condition
     * @param {number} data.endConditionId - ID of the parent condition group
     * @returns {Promise<EndCondition>} Created end condition object
     * @throws {ApiError} Bad request if creation fails or validation errors occur
     */
    async create(data) {
        try {
            const { name, operator, value, endConditionId } = data;

            const endCondition = await EndConditionRepository.create({
                name: name,
                operator: operator,
                value: value,
                endConditionId: endConditionId
            });

            return endCondition;
        } catch (e) {
            throw ApiError.badRequest('Error creating end condition', e.message);
        }
    }

    /**
     * Finds a specific end condition by its ID
     * Used for condition validation and detailed condition information
     * @param {number} endConditionId - ID of the end condition to find
     * @returns {Promise<EndCondition>} End condition object
     * @throws {ApiError} Bad request if condition not found or operation fails
     */
    async findById(endConditionId) {
        try {
            return await EndConditionRepository.findByPk(endConditionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding end condition by ID', e.message);
        }
    }

    /**
     * Finds all individual conditions within a specific event end condition group
     * Used for detailed condition evaluation and progress tracking
     * @param {number} eventEndConditionId - ID of the parent condition group
     * @returns {Promise<EndCondition[]>} Array of individual conditions in the group
     * @throws {ApiError} Bad request if operation fails
     */
    async findByEventEndCondition(eventEndConditionId) {
        try {
            return await EndConditionRepository.findByEventEndCondition(eventEndConditionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding end conditions by event end condition', e.message);
        }
    }

    /**
     * Updates the completion status of an individual end condition
     * Used when a specific condition is met (e.g., time reached, participant count achieved)
     * @param {number} endConditionId - ID of the condition to update
     * @param {boolean} isCompleted - Whether the condition is now completed
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Bad request if update fails or condition not found
     */
    async updateCompletion(endConditionId, isCompleted) {
        try {
            return await EndConditionRepository.updateCompletion(endConditionId, isCompleted);
        } catch (e) {
            throw ApiError.badRequest('Error updating end condition completion', e.message);
        }
    }
}

module.exports = new EndConditionService();