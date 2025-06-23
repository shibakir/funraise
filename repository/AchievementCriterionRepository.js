const BaseRepository = require('./BaseRepository');
const { AchievementCriterion, Achievement } = require('../model');

class AchievementCriterionRepository extends BaseRepository {
    constructor() {
        super(AchievementCriterion);
    }

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