const { Participation } = require('../model');
const ApiError = require('../exception/ApiError');
const createParticipationSchema = require("../validation/schema/ParticipationSchema");

const EventCompletionTracker = require('../utils/achievement/EventCompletionTracker');
const eventConditions = require('../utils/eventCondition');

class ParticipationService {

    async create(data) {

        const { error } = createParticipationSchema.validate(data);
        if (error) {
            throw ApiError.badRequest(error.details[0].message);
        }

        const { deposit, userId, eventId } = data;

        try {
            const participation = await Participation.create({
                deposit: deposit,
                userId: userId,
                eventId: eventId
            });

            // Track event participation for achievements
            await EventCompletionTracker.handleEventParticipation(userId, eventId, deposit);

            // Track event conditions for event completion
            
            await eventConditions.onParticipationAdded(eventId, userId, deposit);

            return participation;
        } catch (e) {
            throw ApiError.badRequest(e.message);
        }
    }

    async findByUserAndEvent(userId, eventId) {
        try {
            const { User, Event } = require('../model');
            return await Participation.findOne({
                where: { userId, eventId },
                include: [
                    { model: User, as: 'user' },
                    { model: Event, as: 'event' }
                ]
            });
        } catch (e) {
            throw ApiError.database('Error finding participation by user and event', e);
        }
    }

    async findById(participationId) {
        try {
            const { User, Event } = require('../model');
            const participation = await Participation.findByPk(participationId, {
                include: [
                    { model: User, as: 'user' },
                    { model: Event, as: 'event' }
                ]
            });

            if (!participation) {
                throw ApiError.notFound('Participation not found');
            }

            return participation;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding participation by ID', e);
        }
    }

    async findByUser(userId) {
        try {
            const { Event } = require('../model');
            return await Participation.findAll({
                where: { userId: userId },
                include: [
                    { model: Event, as: 'event' }
                ]
            });
        } catch (e) {
            throw ApiError.database('Error finding participations by user', e);
        }
    }

    async findByEvent(eventId) {
        try {
            const { User } = require('../model');
            return await Participation.findAll({
                where: { eventId: eventId },
                include: [
                    { model: User, as: 'user' }
                ]
            });
        } catch (e) {
            throw ApiError.database('Error finding participations by event', e);
        }
    }

    async update(participationId, updateData) {
        try {
            const result = await Participation.update(updateData, {
                where: { id: participationId }
            });

            if (result[0] === 0) {
                throw ApiError.notFound('Participation not found');
            }

            return await this.findById(participationId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error updating participation', e);
        }
    }
}

module.exports = new ParticipationService();