const BaseRepository = require('./BaseRepository');
const { EndCondition } = require('../model');

class EndConditionRepository extends BaseRepository {
    constructor() {
        super(EndCondition);
    }

    async findByEventEndCondition(eventEndConditionId) {
        return await this.findAll({
            where: { endConditionId: eventEndConditionId }
        });
    }

    async updateCompletion(endConditionId, isCompleted) {
        return await this.update(endConditionId, { isCompleted });
    }
}

module.exports = new EndConditionRepository(); 