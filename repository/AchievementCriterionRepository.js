const BaseRepository = require('./BaseRepository');
const { AchievementCriterion, Achievement } = require('../model');

/**
 * Repository for managing achievement criteria and requirements
 * Handles the specific conditions that must be met to unlock achievements
 */
class AchievementCriterionRepository extends BaseRepository {
    /**
     * Initializes the AchievementCriterion repository with the AchievementCriterion model
     */
    constructor() {
        super(AchievementCriterion);
    }

    /**
     * Finds all criteria of a specific type with their associated achievements
     * Used for achievement tracking and progress calculation by criterion type
     * @param {string} criterionType - Type of criterion (e.g., 'EVENT_PARTICIPATION', 'DEPOSIT_AMOUNT')
     * @returns {Promise<AchievementCriterion[]>} Array of criteria with achievement details
     */
    async findByType(criterionType) {
        return await this.findAll({
            where: { type: criterionType },
            include: [{
                model: Achievement,
                as: 'achievement'
            }]
        });
    }
}

module.exports = new AchievementCriterionRepository(); 