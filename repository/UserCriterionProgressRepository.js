const BaseRepository = require('./BaseRepository');
const { UserCriterionProgress, AchievementCriterion } = require('../model');

class UserCriterionProgressRepository extends BaseRepository {
    constructor() {
        super(UserCriterionProgress);
    }

    async findByUserAchievementAndCriterion(userAchievementId, criterionId) {
        return await this.findOne({
            where: {
                userAchievementId,
                criterionId
            }
        });
    }

    async findByUserAchievement(userAchievementId) {
        return await this.findAll({
            where: { userAchievementId }
        });
    }

    async findByUserAchievementWithCriteria(userAchievementId) {
        return await this.findAll({
            where: { userAchievementId },
            include: [{
                model: AchievementCriterion,
                as: 'criterion'
            }]
        });
    }

    async createProgress(userAchievementId, criterionId, currentValue = 0, completed = false) {
        return await this.create({
            userAchievementId,
            criterionId,
            currentValue,
            completed
        });
    }

    async updateProgress(progressId, currentValue, completed, completedAt = null) {
        return await this.update(progressId, {
            currentValue,
            completed,
            completedAt
        });
    }
}

module.exports = new UserCriterionProgressRepository(); 