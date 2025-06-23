const ApiError = require('../exception/ApiError');
const { EndConditionRepository } = require('../repository');
const Joi = require("joi");

class EndConditionService {

    async create(data) {
        try {
            const { name, operator, value, endConditionId } = data;

            const endCondition = await EndConditionRepository.create({
                name: name,
                operator: operator,
                value: value,
                endConditionId: endConditionId
            });

            return endCondition;
        } catch (e) {
            throw ApiError.badRequest('Error creating end condition', e.message);
        }
    }

    async findById(endConditionId) {
        try {
            return await EndConditionRepository.findByPk(endConditionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding end condition by ID', e.message);
        }
    }

    async findByEventEndCondition(eventEndConditionId) {
        try {
            return await EndConditionRepository.findByEventEndCondition(eventEndConditionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding end conditions by event end condition', e.message);
        }
    }

    async updateCompletion(endConditionId, isCompleted) {
        try {
            return await EndConditionRepository.updateCompletion(endConditionId, isCompleted);
        } catch (e) {
            throw ApiError.badRequest('Error updating end condition completion', e.message);
        }
    }
}

module.exports = new EndConditionService();