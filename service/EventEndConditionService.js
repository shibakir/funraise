const ApiError = require('../exception/ApiError');
const { EventEndConditionRepository } = require('../repository');

const EndConditionService = require('./EndConditionService');

/**
 * Service layer for managing event end condition groups
 * Handles the high-level condition groups that determine when an event should end
 * Each group contains multiple individual conditions that work together
 * Manages group creation, status updates, and condition evaluation
 */
class EventEndConditionService {

    /**
     * Creates a new event end condition group with its individual conditions
     * Establishes a group of conditions that must be met together for event completion
     * @param {Object} data - Condition group creation data
     * @param {Array} data.conditions - Array of individual conditions within the group
     * @param {number} data.eventId - ID of the event this condition group belongs to
     * @returns {Promise<EventEndCondition>} Created condition group object
     * @throws {ApiError} Bad request if creation fails or validation errors occur
     */
    async create(data) {
        try {
            const { conditions, eventId } = data;

            // Create the main condition group
            const eventEndConditionGroup = await EventEndConditionRepository.create({
                eventId: eventId
            });

            // Create all individual conditions within this group
            for (const condition of conditions) {
                const endCondition = await EndConditionService.create({
                    name: condition.name,
                    operator: condition.operator,
                    value: condition.value,
                    endConditionId: eventEndConditionGroup.id
                });
            }
            return eventEndConditionGroup;
        } catch (e) {
            throw ApiError.badRequest(e.message);
        }
    }

    /**
     * Finds all end condition groups for an event with their individual conditions
     * Used for event condition evaluation and completion checking
     * @param {number} eventId - ID of the event
     * @returns {Promise<EventEndCondition[]>} Array of condition groups with their conditions
     * @throws {ApiError} Bad request if operation fails
     */
    async findByEventWithConditions(eventId) {
        try {
            return await EventEndConditionRepository.findByEventWithConditions(eventId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event end conditions with conditions', e.message);
        }
    }

    /**
     * Finds a specific event end condition group by its ID
     * Used for direct condition group access and validation
     * @param {number} eventEndConditionId - ID of the condition group
     * @returns {Promise<EventEndCondition>} Condition group object
     * @throws {ApiError} Bad request if condition group not found or operation fails
     */
    async findById(eventEndConditionId) {
        try {
            return await EventEndConditionRepository.findByPk(eventEndConditionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event end condition by ID', e.message);
        }
    }

    /**
     * Updates the completion status of an event end condition group
     * Used when all conditions within a group are satisfied
     * @param {number} eventEndConditionId - ID of the condition group
     * @param {boolean} isCompleted - Whether the condition group is completed
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Bad request if update fails or condition group not found
     */
    async updateCompletion(eventEndConditionId, isCompleted) {
        try {
            return await EventEndConditionRepository.updateCompletion(eventEndConditionId, isCompleted);
        } catch (e) {
            throw ApiError.badRequest('Error updating event end condition completion', e.message);
        }
    }

    /**
     * Updates the failure status of an event end condition group
     * Used when conditions cannot be met (e.g., time limit exceeded)
     * @param {number} eventEndConditionId - ID of the condition group
     * @param {boolean} isFailed - Whether the condition group has failed
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Bad request if update fails or condition group not found
     */
    async updateFailure(eventEndConditionId, isFailed) {
        try {
            return await EventEndConditionRepository.updateFailure(eventEndConditionId, isFailed);
        } catch (e) {
            throw ApiError.badRequest('Error updating event end condition failure status', e.message);
        }
    }

    /**
     * Finds all end condition groups for a specific event
     * Alias method for consistency with naming conventions
     * @param {number} eventId - ID of the event
     * @returns {Promise<EventEndCondition[]>} Array of condition groups with their conditions
     * @throws {ApiError} Bad request if operation fails
     */
    async findByEventId(eventId) {
        try {
            return await EventEndConditionRepository.findByEventId(eventId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event end conditions by event ID', e.message);
        }
    }

}

module.exports = new EventEndConditionService();