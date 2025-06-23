const BaseRepository = require('./BaseRepository');
const { EventEndCondition, EndCondition } = require('../model');

class EventEndConditionRepository extends BaseRepository {
    constructor() {
        super(EventEndCondition);
    }

    async findByEventWithConditions(eventId) {
        return await this.findAll({
            where: { eventId },
            include: [{
                model: EndCondition,
                as: 'conditions'
            }]
        });
    }

    async findByEventId(eventId) {
        return await this.findAll({
            where: { eventId },
            include: [{
                model: EndCondition,
                as: 'conditions'
            }]
        });
    }

    async updateCompletion(eventEndConditionId, isCompleted) {
        return await this.update(eventEndConditionId, { isCompleted });
    }

    async updateFailure(eventEndConditionId, isFailed) {
        return await this.update(eventEndConditionId, { isFailed });
    }
}

module.exports = new EventEndConditionRepository(); 