const BaseRepository = require('./BaseRepository');
const { Achievement, AchievementCriterion } = require('../model');

/**
 * Repository for managing achievements and their criteria
 * Handles achievement data retrieval with associated completion requirements
 */
class AchievementRepository extends BaseRepository {
    /**
     * Initializes the Achievement repository with the Achievement model
     */
    constructor() {
        super(Achievement);
    }

    /**
     * Finds all achievements with their associated criteria
     * Used for achievement system initialization and complete achievement listing
     * @returns {Promise<Achievement[]>} Array of achievements with their completion criteria
     */
    async findAllWithCriteria() {
        return await this.findAll({
            include: [{
                model: AchievementCriterion,
                as: 'criteria'
            }]
        });
    }
}

module.exports = new AchievementRepository(); 