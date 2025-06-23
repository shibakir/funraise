const ApiError = require('../exception/ApiError');
const { ParticipationRepository } = require('../repository');
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
            const participation = await ParticipationRepository.create({
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
            return await ParticipationRepository.findByUserAndEvent(userId, eventId);
        } catch (e) {
            throw ApiError.database('Error finding participation by user and event', e);
        }
    }

    async findById(participationId) {
        try {
            return await ParticipationRepository.findByIdWithAssociations(participationId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding participation by ID', e);
        }
    }

    async findByUser(userId) {
        try {
            return await ParticipationRepository.findByUser(userId);
        } catch (e) {
            throw ApiError.database('Error finding participations by user', e);
        }
    }

    async findByEvent(eventId) {
        try {
            return await ParticipationRepository.findByEvent(eventId);
        } catch (e) {
            throw ApiError.database('Error finding participations by event', e);
        }
    }

    async update(participationId, updateData) {
        try {
            await ParticipationRepository.update(participationId, updateData);
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