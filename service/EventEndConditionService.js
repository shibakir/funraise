const { EventEndCondition } = require('../model');
const ApiError = require('../exception/ApiError');

const EndConditionService = require('./EndConditionService');

class EventEndConditionService {

    async create(data) {
        try {
            const { conditions, eventId } = data;

            const eventEndConditionGroup = await EventEndCondition.create({
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
            return await EventEndCondition.findAll({
                where: { eventId: eventId },
                include: [{
                    model: require('../model').EndCondition,
                    as: 'conditions'
                }]
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding event end conditions with conditions', e.message);
        }
    }

    async findById(eventEndConditionId) {
        try {
            return await EventEndCondition.findByPk(eventEndConditionId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event end condition by ID', e.message);
        }
    }

    async updateCompletion(eventEndConditionId, isCompleted) {
        try {
            return await EventEndCondition.update(
                { isCompleted: isCompleted },
                { where: { id: eventEndConditionId } }
            );
        } catch (e) {
            throw ApiError.badRequest('Error updating event end condition completion', e.message);
        }
    }

    async updateFailure(eventEndConditionId, isFailed) {
        try {
            return await EventEndCondition.update(
                { isFailed: isFailed },
                { where: { id: eventEndConditionId } }
            );
        } catch (e) {
            throw ApiError.badRequest('Error updating event end condition failure status', e.message);
        }
    }

    async findByEventId(eventId) {
        try {
            return await EventEndCondition.findAll({
                where: { eventId: eventId },
                include: [{
                    model: require('../model').EndCondition,
                    as: 'conditions'
                }]
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding event end conditions by event ID', e.message);
        }
    }

}

module.exports = new EventEndConditionService();