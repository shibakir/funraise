const { UserCriterionProgress, User, AchievementCriterion } = require('../model');
const ApiError = require('../exception/ApiError');

const createUserCriterionProgressSchema  = require("../validation/schema/UserCriterionProgressSchema");

class UserCriterionProgressService {

    async create(data) {

        const { error } = createUserCriterionProgressSchema.validate(data);
        if (error) {
            throw ApiError.badRequest(error.details[0].message);
        }

        try {
            const { userId, achievementId } = data;

            const user = await User.findOne({ id: userId });
            if (!user) {
                throw Error('User does not exist');
            }

            const achievementCriterion = await AchievementCriterion.findOne({ id: achievementId });
            if (!achievementCriterion) {
                throw Error('Achievement Criterion does not exist');
            }

            const userCriterionProgress = await UserCriterionProgress.create({
                userId: userId,
                achievementId: achievementId,
            });

            return userCriterionProgress;
        } catch (e) {
            throw ApiError.badRequest('Error creating user achievement', e.message);
        }
    }

    async findByUserAchievementAndCriterion(userAchievementId, criterionId) {
        try {
            return await UserCriterionProgress.findOne({
                where: {
                    userAchievementId: userAchievementId,
                    criterionId: criterionId
                }
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding user criterion progress', e.message);
        }
    }

    async findByUserAchievement(userAchievementId) {
        try {
            return await UserCriterionProgress.findAll({
                where: { userAchievementId: userAchievementId }
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding progress by user achievement', e.message);
        }
    }

    async findByUserAchievementWithCriteria(userAchievementId) {
        try {
            return await UserCriterionProgress.findAll({
                where: { userAchievementId: userAchievementId },
                include: [{
                    model: require('../model').AchievementCriterion,
                    as: 'criterion'
                }]
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding progress with criteria by user achievement', e.message);
        }
    }

    async createProgress(userAchievementId, criterionId, currentValue = 0, completed = false) {
        try {
            return await UserCriterionProgress.create({
                userAchievementId: userAchievementId,
                criterionId: criterionId,
                currentValue: currentValue,
                completed: completed
            });
        } catch (e) {
            throw ApiError.badRequest('Error creating user criterion progress', e.message);
        }
    }

    async updateProgress(progressId, currentValue, completed, completedAt = null) {
        try {
            return await UserCriterionProgress.update(
                {
                    currentValue: currentValue,
                    completed: completed,
                    completedAt: completedAt
                },
                { where: { id: progressId } }
            );
        } catch (e) {
            throw ApiError.badRequest('Error updating user criterion progress', e.message);
        }
    }

}

module.exports = new UserCriterionProgressService();