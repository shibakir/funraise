const BaseRepository = require('./BaseRepository');
const { Event, EventEndCondition, EndCondition, Participation, User } = require('../model');
const { EVENT_STATUSES, CONDITION_TYPES } = require('../constants');

class EventRepository extends BaseRepository {
    constructor() {
        super(Event);
    }

    async findByIdWithParticipants(eventId) {
        return await this.findByPk(eventId, {
            include: [
                {
                    model: Participation,
                    as: 'participations',
                    include: [{ 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'balance'] 
                    }]
                }
            ]
        });
    }

    async findByUser(userId, limit = 30) {
        return await this.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit
        });
    }

    async findByIdWithEndConditions(eventId) {
        return await this.findByPk(eventId, {
            include: [{
                model: EventEndCondition,
                as: 'endConditions',
                include: [{
                    model: EndCondition,
                    as: 'conditions'
                }]
            }]
        });
    }

    async findByIdWithOptionalEndConditions(eventId, includeEndConditions = true) {
        const includeOptions = [];
        
        if (includeEndConditions) {
            includeOptions.push({
                model: EventEndCondition,
                as: 'endConditions',
                include: [{
                    model: EndCondition,
                    as: 'conditions'
                }]
            });
        }

        return await this.findByPk(eventId, {
            include: includeOptions
        });
    }

    async findAllWithOptionalEndConditions(includeEndConditions = true) {
        const includeOptions = [];
        
        if (includeEndConditions) {
            includeOptions.push({
                model: EventEndCondition,
                as: 'endConditions',
                include: [{
                    model: EndCondition,
                    as: 'conditions'
                }]
            });
        }

        return await this.findAll({
            include: includeOptions
        });
    }

    async findCreator(eventId) {
        const event = await this.findByPk(eventId, {
            include: [{ 
                model: User, 
                as: 'creator' 
            }]
        });
        return event ? event.creator : null;
    }

    async findRecipient(eventId) {
        const event = await this.findByPk(eventId, {
            include: [{ 
                model: User, 
                as: 'recipient' 
            }]
        });
        return event ? event.recipient : null;
    }

    async findActiveEvents() {
        return await this.findAll({
            where: { 
                status: EVENT_STATUSES.IN_PROGRESS 
            },
            include: [{
                model: EventEndCondition,
                as: 'endConditions',
                include: [{
                    model: EndCondition,
                    as: 'conditions',
                    where: {
                        name: CONDITION_TYPES.TIME
                    },
                    required: false
                }]
            }]
        });
    }

    async updateStatus(eventId, status) {
        return await this.update(eventId, { status });
    }
}

module.exports = new EventRepository(); 