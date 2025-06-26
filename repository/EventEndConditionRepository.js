const BaseRepository = require('./BaseRepository');
const { EventEndCondition, EndCondition } = require('../model');

/**
 * Repository for managing event end condition groups
 * Handles the high-level condition groups that determine when an event should end
 * Each group contains multiple individual conditions that work together
 */
class EventEndConditionRepository extends BaseRepository {
    /**
     * Initializes the EventEndCondition repository with the EventEndCondition model
     */
    constructor() {
        super(EventEndCondition);
    }

    /**
     * Finds all end condition groups for an event with their individual conditions
     * Used for event condition evaluation and completion checking
     * @param {number} eventId - ID of the event
     * @returns {Promise<EventEndCondition[]>} Array of condition groups with their conditions
     */
    async findByEventWithConditions(eventId) {
        return await this.findAll({
            where: { eventId },
            include: [{
                model: EndCondition,
                as: 'conditions'
            }]
        });
    }

    /**
     * Finds all end condition groups for a specific event
     * Alias method for consistency with naming conventions
     * @param {number} eventId - ID of the event
     * @returns {Promise<EventEndCondition[]>} Array of condition groups with their conditions
     */
    async findByEventId(eventId) {
        return await this.findAll({
            where: { eventId },
            include: [{
                model: EndCondition,
                as: 'conditions'
            }]
        });
    }

    /**
     * Updates the completion status of an event end condition group
     * Used when all conditions within a group are satisfied
     * @param {number} eventEndConditionId - ID of the condition group
     * @param {boolean} isCompleted - Whether the condition group is completed
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if condition group doesn't exist or database error
     */
    async updateCompletion(eventEndConditionId, isCompleted) {
        return await this.update(eventEndConditionId, { isCompleted });
    }

    /**
     * Updates the failure status of an event end condition group
     * Used when conditions cannot be met (e.g., time limit exceeded)
     * @param {number} eventEndConditionId - ID of the condition group
     * @param {boolean} isFailed - Whether the condition group has failed
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if condition group doesn't exist or database error
     */
    async updateFailure(eventEndConditionId, isFailed) {
        return await this.update(eventEndConditionId, { isFailed });
    }
}

module.exports = new EventEndConditionRepository(); 