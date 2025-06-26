const BaseRepository = require('./BaseRepository');
const { EndCondition } = require('../model');

/**
 * Repository for managing individual event end conditions
 * Handles specific conditions within condition groups (e.g., time limits, participant counts, deposit amounts)
 */
class EndConditionRepository extends BaseRepository {
    /**
     * Initializes the EndCondition repository with the EndCondition model
     */
    constructor() {
        super(EndCondition);
    }

    /**
     * Finds all individual conditions within a specific event end condition group
     * Used for detailed condition evaluation and progress tracking
     * @param {number} eventEndConditionId - ID of the parent condition group
     * @returns {Promise<EndCondition[]>} Array of individual conditions in the group
     */
    async findByEventEndCondition(eventEndConditionId) {
        return await this.findAll({
            where: { endConditionId: eventEndConditionId }
        });
    }

    /**
     * Updates the completion status of an individual end condition
     * Used when a specific condition is met (e.g., time reached, participant count achieved)
     * @param {number} endConditionId - ID of the condition to update
     * @param {boolean} isCompleted - Whether the condition is now completed
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if condition doesn't exist or database error
     */
    async updateCompletion(endConditionId, isCompleted) {
        return await this.update(endConditionId, { isCompleted });
    }
}

module.exports = new EndConditionRepository(); 