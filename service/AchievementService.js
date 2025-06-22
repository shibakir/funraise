const { Achievement } = require('../model');
const ApiError = require('../exception/ApiError');

const createAchievementSchema  = require("../validation/schema/AchievementSchema");

class AchievementService {

    async create(data) {

        const { error } = createAchievementSchema.validate(data);
        if (error) {
            throw ApiError.validation('Validation failed', error.details.map(d => d.message));
        }

        try {
            const { name, iconUrl, conditions } = data;

            if ( conditions.length === 0 ) {
                throw ApiError.businessLogic('At least one condition is required');
            }

            const achievement = await Achievement.create({
                name: name,
                iconUrl: iconUrl,
            });

            return achievement;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error creating achievement', e);
        }
    }

    async getAllWithCriteria() {
        try {
            return await Achievement.findAll({
                include: [{
                    model: require('../model').AchievementCriterion,
                    as: 'criteria'
                }]
            });
        } catch (e) {
            throw ApiError.database('Error getting achievements with criteria', e);
        }
    }

    async findById(achievementId) {
        try {
            const achievement = await Achievement.findByPk(achievementId);
            if (!achievement) {
                throw ApiError.notFound('Achievement not found');
            }
            return achievement;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding achievement by ID', e);
        }
    }
}

module.exports = new AchievementService();