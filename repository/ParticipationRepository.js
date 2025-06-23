const BaseRepository = require('./BaseRepository');
const { Participation, User, Event } = require('../model');

class ParticipationRepository extends BaseRepository {
    constructor() {
        super(Participation);
    }

    async findByUserAndEvent(userId, eventId) {
        return await this.findOne({
            where: { userId, eventId },
            include: [
                { model: User, as: 'user' },
                { model: Event, as: 'event' }
            ]
        });
    }

    async findByIdWithAssociations(participationId) {
        return await this.findByPk(participationId, {
            include: [
                { model: User, as: 'user' },
                { model: Event, as: 'event' }
            ]
        });
    }

    async findByUser(userId) {
        return await this.findAll({
            where: { userId },
            include: [
                { model: Event, as: 'event' }
            ]
        });
    }

    async findByEvent(eventId) {
        return await this.findAll({
            where: { eventId },
            include: [
                { model: User, as: 'user' }
            ]
        });
    }

    async findByEventForCalculation(eventId) {
        return await this.findAll({
            where: { eventId },
            attributes: ['deposit']
        });
    }
}

module.exports = new ParticipationRepository(); 