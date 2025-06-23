const ApiError = require('../exception/ApiError');
const { EventEndConditionRepository } = require('../repository');

const EndConditionService = require('./EndConditionService');

class EventEndConditionService {

    async create(data) {
        try {
            const { conditions, eventId } = data;

            const eventEndConditionGroup = await EventEndConditionRepository.create({
                eventId: eventId
            });

            for (const condition of conditions) {
                const endCondition = await EndConditionService.create({
                    name: condition.name,
                    operator: condition.operator,
                    value: condition.value,
                    endConditionId: eventEndConditionGroup.id
                });
            }
            return eventEndConditionGroup;
        } catch (e) {
            throw ApiError.badRequest(e.message);
        }
    }

    async findByEventWithConditions(eventId) {
        try {
            return await EventEndConditionRepository.findByEventWithConditions(eventId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event end conditions with conditions', e.message);
        }
    }

    async findById(eventEndConditionId) {
        try {
            return await EventEndConditionRepository.findByPk(eventEndConditionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event end condition by ID', e.message);
        }
    }

    async updateCompletion(eventEndConditionId, isCompleted) {
        try {
            return await EventEndConditionRepository.updateCompletion(eventEndConditionId, isCompleted);
        } catch (e) {
            throw ApiError.badRequest('Error updating event end condition completion', e.message);
        }
    }

    async updateFailure(eventEndConditionId, isFailed) {
        try {
            return await EventEndConditionRepository.updateFailure(eventEndConditionId, isFailed);
        } catch (e) {
            throw ApiError.badRequest('Error updating event end condition failure status', e.message);
        }
    }

    async findByEventId(eventId) {
        try {
            return await EventEndConditionRepository.findByEventId(eventId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event end conditions by event ID', e.message);
        }
    }

}

module.exports = new EventEndConditionService();