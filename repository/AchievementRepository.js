const BaseRepository = require('./BaseRepository');
const { Achievement, AchievementCriterion } = require('../model');

class AchievementRepository extends BaseRepository {
    constructor() {
        super(Achievement);
    }

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