const { UserAchievement, User, Achievement } = require('../model');
const ApiError = require('../exception/ApiError');

const createUserAchievement  = require("../validation/schema/UserAchievement");

class UserAchievementService {

    async create(data) {

        const { error } = createUserAchievement.validate(data);
        if (error) {
            throw ApiError.validation('Validation failed', error.details.map(d => d.message));
        }

        try {
            const { userId, achievementId } = data;

            const user = await User.findOne({ where: { id: userId } });
            if(!user) {
                throw ApiError.notFound('User does not exist');
            }

            const achievement = await Achievement.findOne({ where: { id: achievementId } });
            if (!achievement) {
                throw ApiError.notFound('Achievement does not exist');
            }

            // check if user already has this achievement
            const existingUserAchievement = await this.findByUserAndAchievement(userId, achievementId);
            if (existingUserAchievement) {
                throw ApiError.conflict('User already has this achievement');
            }

            const userAchievement = await UserAchievement.create({
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
            return await UserAchievement.findOne({
                where: {
                    userId: userId,
                    achievementId: achievementId
                }
            });
        } catch (e) {
            throw ApiError.database('Error finding user achievement', e);
        }
    }

    async findById(userAchievementId) {
        try {
            const userAchievement = await UserAchievement.findByPk(userAchievementId);
            if (!userAchievement) {
                throw ApiError.notFound('User achievement not found');
            }
            return userAchievement;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding user achievement by ID', e);
        }
    }

    async findByUserWithDetails(userId) {
        try {
            return await UserAchievement.findAll({
                where: { userId: userId },
                include: [
                    {
                        model: Achievement,
                        as: 'achievement'
                    },
                    {
                        model: require('../model').UserCriterionProgress,
                        as: 'progresses',
                        include: [{
                            model: require('../model').AchievementCriterion,
                            as: 'criterion'
                        }]
                    }
                ]
            });
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

            return await UserAchievement.update(
                { 
                    status: status,
                    unlockedAt: unlockedAt
                },
                { where: { id: userAchievementId } }
            );
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error updating user achievement status', e);
        }
    }

}

module.exports = new UserAchievementService();