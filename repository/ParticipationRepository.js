const BaseRepository = require('./BaseRepository');
const { Participation, User, Event } = require('../model');

/**
 * Repository for managing user participation in events
 * Handles user deposits, participation tracking, and event-user relationship data
 */
class ParticipationRepository extends BaseRepository {
    /**
     * Initializes the Participation repository with the Participation model
     */
    constructor() {
        super(Participation);
    }

    /**
     * Finds a specific user's participation in a specific event
     * Used to check if user is already participating and get deposit amount
     * @param {number} userId - ID of the participating user
     * @param {number} eventId - ID of the event
     * @returns {Promise<Participation|null>} Participation with user and event data or null if not found
     */
    async findByUserAndEvent(userId, eventId) {
        return await this.findOne({
            where: { userId, eventId },
            include: [
                { model: User, as: 'user' },
                { model: Event, as: 'event' }
            ]
        });
    }

    /**
     * Finds a participation by ID with all associated user and event data
     * Used for detailed participation information retrieval
     * @param {number} participationId - ID of the participation record
     * @returns {Promise<Participation>} Participation with full user and event details
     * @throws {ApiError} Not found error if participation doesn't exist
     */
    async findByIdWithAssociations(participationId) {
        return await this.findByPk(participationId, {
            include: [
                { model: User, as: 'user' },
                { model: Event, as: 'event' }
            ]
        });
    }

    /**
     * Finds all participations for a specific user
     * Used for user history and portfolio display
     * @param {number} userId - ID of the user
     * @returns {Promise<Participation[]>} Array of user's participations with event details
     */
    async findByUser(userId) {
        return await this.findAll({
            where: { userId },
            include: [
                { model: Event, as: 'event' }
            ]
        });
    }

    /**
     * Finds all participations in a specific event
     * Used for event participant listing and management
     * @param {number} eventId - ID of the event
     * @returns {Promise<Participation[]>} Array of participations with user details
     */
    async findByEvent(eventId) {
        return await this.findAll({
            where: { eventId },
            include: [
                { model: User, as: 'user' }
            ]
        });
    }

    /**
     * Finds all participations for an event with only deposit amounts
     * Used for efficient bank amount calculation without loading unnecessary data
     * @param {number} eventId - ID of the event
     * @returns {Promise<Participation[]>} Array of participations with only deposit field
     */
    async findByEventForCalculation(eventId) {
        return await this.findAll({
            where: { eventId },
            attributes: ['deposit']
        });
    }
}

module.exports = new ParticipationRepository(); 