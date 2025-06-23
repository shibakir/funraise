const ApiError = require('../exception/ApiError');
const { UserCriterionProgressRepository, UserRepository, AchievementCriterionRepository } = require('../repository');

const createUserCriterionProgressSchema  = require("../validation/schema/UserCriterionProgressSchema");

class UserCriterionProgressService {

    async create(data) {

        const { error } = createUserCriterionProgressSchema.validate(data);
        if (error) {
            throw ApiError.badRequest(error.details[0].message);
        }

        try {
            const { userId, achievementId } = data;

            const user = await UserRepository.findByPk(userId);
            if (!user) {
                throw Error('User does not exist');
            }

            const achievementCriterion = await AchievementCriterionRepository.findByPk(achievementId);
            if (!achievementCriterion) {
                throw Error('Achievement Criterion does not exist');
            }

            const userCriterionProgress = await UserCriterionProgressRepository.create({
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
            return await UserCriterionProgressRepository.findByUserAchievementAndCriterion(userAchievementId, criterionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding user criterion progress', e.message);
        }
    }

    async findByUserAchievement(userAchievementId) {
        try {
            return await UserCriterionProgressRepository.findByUserAchievement(userAchievementId);
        } catch (e) {
            throw ApiError.badRequest('Error finding progress by user achievement', e.message);
        }
    }

    async findByUserAchievementWithCriteria(userAchievementId) {
        try {
            return await UserCriterionProgressRepository.findByUserAchievementWithCriteria(userAchievementId);
        } catch (e) {
            throw ApiError.badRequest('Error finding progress with criteria by user achievement', e.message);
        }
    }

    async createProgress(userAchievementId, criterionId, currentValue = 0, completed = false) {
        try {
            return await UserCriterionProgressRepository.createProgress(userAchievementId, criterionId, currentValue, completed);
        } catch (e) {
            throw ApiError.badRequest('Error creating user criterion progress', e.message);
        }
    }

    async updateProgress(progressId, currentValue, completed, completedAt = null) {
        try {
            return await UserCriterionProgressRepository.updateProgress(progressId, currentValue, completed, completedAt);
        } catch (e) {
            throw ApiError.badRequest('Error updating user criterion progress', e.message);
        }
    }

}

module.exports = new UserCriterionProgressService();