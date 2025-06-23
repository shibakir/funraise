const ApiError = require('../exception/ApiError');
const { AchievementCriterionRepository } = require('../repository');

const createAchievementCriterionSchema  = require("../validation/schema/AchievementCriterionSchema");

class AchievementCriterionService {

    async create(data) {

        const { error } = createAchievementCriterionSchema.validate(data);
        if (error) {
            throw ApiError.badRequest(error.details[0].message);
        }

        try {
            const { type, value } = data;

            const achievementCriterion = await AchievementCriterionRepository.create({
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
            return await AchievementCriterionRepository.findByType(criterionType);
        } catch (e) {
            throw ApiError.badRequest('Error finding criteria by type', e.message);
        }
    }

    async findById(criterionId) {
        try {
            return await AchievementCriterionRepository.findByPk(criterionId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding achievement criterion by ID', e);
        }
    }

}

module.exports = new AchievementCriterionService();