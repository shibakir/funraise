const BaseRepository = require('./BaseRepository');
const { UserAchievement, Achievement, UserCriterionProgress, AchievementCriterion } = require('../model');

class UserAchievementRepository extends BaseRepository {
    constructor() {
        super(UserAchievement);
    }

    async findByUserAndAchievement(userId, achievementId) {
        return await this.findOne({
            where: {
                userId,
                achievementId
            }
        });
    }

    async findByUserWithDetails(userId) {
        return await this.findAll({
            where: { userId },
            include: [
                {
                    model: Achievement,
                    as: 'achievement'
                },
                {
                    model: UserCriterionProgress,
                    as: 'progresses',
                    include: [{
                        model: AchievementCriterion,
                        as: 'criterion'
                    }]
                }
            ]
        });
    }

    async updateStatus(userAchievementId, status, unlockedAt = null) {
        return await this.update(userAchievementId, {
            status,
            unlockedAt
        });
    }
}

module.exports = new UserAchievementRepository(); 