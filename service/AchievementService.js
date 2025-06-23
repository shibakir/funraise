const ApiError = require('../exception/ApiError');
const { AchievementRepository } = require('../repository');

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

            const achievement = await AchievementRepository.create({
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
            return await AchievementRepository.findAllWithCriteria();
        } catch (e) {
            throw ApiError.database('Error getting achievements with criteria', e);
        }
    }

    async findById(achievementId) {
        try {
            return await AchievementRepository.findByPk(achievementId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding achievement by ID', e);
        }
    }
}

module.exports = new AchievementService();