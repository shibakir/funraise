const { AchievementCriterion } = require('../model');
const ApiError = require('../exception/ApiError');

const createAchievementCriterionSchema  = require("../validation/schema/AchievementCriterionSchema");

class AchievementCriterionService {

    async create(data) {

        const { error } = createAchievementCriterionSchema.validate(data);
        if (error) {
            throw ApiError.badRequest(error.details[0].message);
        }

        try {
            const { type, value } = data;

            const achievementCriterion = await AchievementCriterion.create({
                type: type,
                value: value
            });

            return achievementCriterion;
        } catch (e) {
            throw ApiError.badRequest('Error creating achievement', e.message);
        }
    }

    async findByType(criterionType) {
        try {
            return await AchievementCriterion.findAll({
                where: { type: criterionType },
                include: [{
                    model: require('../model').Achievement,
                    as: 'achievement'
                }]
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding criteria by type', e.message);
        }
    }

    async findById(criterionId) {
        try {
            const criterion = await AchievementCriterion.findByPk(criterionId);
            if (!criterion) {
                throw ApiError.notFound('Achievement criterion not found');
            }
            return criterion;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding achievement criterion by ID', e);
        }
    }

}

module.exports = new AchievementCriterionService();