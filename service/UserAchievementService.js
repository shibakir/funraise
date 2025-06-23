const ApiError = require('../exception/ApiError');
const { UserAchievementRepository, UserRepository, AchievementRepository } = require('../repository');

const createUserAchievement  = require("../validation/schema/UserAchievement");

class UserAchievementService {

    async create(data) {

        const { error } = createUserAchievement.validate(data);
        if (error) {
            throw ApiError.validation('Validation failed', error.details.map(d => d.message));
        }

        try {
            const { userId, achievementId } = data;

            const user = await UserRepository.findByPk(userId);
            if(!user) {
                throw ApiError.notFound('User does not exist');
            }

            const achievement = await AchievementRepository.findByPk(achievementId);
            if (!achievement) {
                throw ApiError.notFound('Achievement does not exist');
            }

            // check if user already has this achievement
            const existingUserAchievement = await this.findByUserAndAchievement(userId, achievementId);
            if (existingUserAchievement) {
                throw ApiError.conflict('User already has this achievement');
            }

            const userAchievement = await UserAchievementRepository.create({
                userId: userId,
                achievementId: achievementId,
            });

            return userAchievement;
        } catch (e) {
            // If it's an ApiError, just throw it
            if (e instanceof ApiError) {
                throw e;
            }
            // Otherwise wrap in database error
            throw ApiError.database('Error creating user achievement', e);
        }
    }

    async findByUserAndAchievement(userId, achievementId) {
        try {
            return await UserAchievementRepository.findByUserAndAchievement(userId, achievementId);
        } catch (e) {
            throw ApiError.database('Error finding user achievement', e);
        }
    }

    async findById(userAchievementId) {
        try {
            return await UserAchievementRepository.findByPk(userAchievementId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding user achievement by ID', e);
        }
    }

    async findByUserWithDetails(userId) {
        try {
            return await UserAchievementRepository.findByUserWithDetails(userId);
        } catch (e) {
            throw ApiError.database('Error getting user achievements with details', e);
        }
    }

    async updateStatus(userAchievementId, status, unlockedAt = null) {
        try {
            const userAchievement = await this.findById(userAchievementId);
            
            if (status === userAchievement.status) {
                throw ApiError.businessLogic('Achievement status is already set to this value');
            }

            return await UserAchievementRepository.updateStatus(userAchievementId, status, unlockedAt);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error updating user achievement status', e);
        }
    }

}

module.exports = new UserAchievementService();