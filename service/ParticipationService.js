const ApiError = require('../exception/ApiError');
const { ParticipationRepository } = require('../repository');

const EventCompletionTracker = require('../utils/achievement/EventCompletionTracker');
const eventConditions = require('../utils/eventCondition');

/**
 * Service layer for managing user participation in events
 * Handles participation creation, deposit management, achievement tracking,
 * and integration with event condition monitoring systems
 */
class ParticipationService {

    /**
     * Creates a new participation record for a user in an event
     * Integrates with achievement tracking and event condition monitoring
     * @param {Object} data - Participation creation data
     * @param {number} data.deposit - Amount user is depositing to participate
     * @param {number} data.userId - ID of the participating user
     * @param {number} data.eventId - ID of the event to participate in
     * @returns {Promise<Participation>} Created participation object
     * @throws {ApiError} Bad request if creation fails or validation errors occur
     */
    async create(data) {
        const { deposit, userId, eventId } = data;

        try {
            const participation = await ParticipationRepository.create({
                deposit: deposit,
                userId: userId,
                eventId: eventId
            });

            // Track event participation for achievement system (non-blocking)
            await EventCompletionTracker.handleEventParticipation(userId, eventId, deposit);

            // Update event conditions for potential event completion (non-blocking)
            await eventConditions.onParticipationAdded(eventId, userId, deposit);

            return participation;
        } catch (e) {
            throw ApiError.badRequest(e.message);
        }
    }

    /**
     * Finds a specific user's participation in a specific event
     * Used to check if user is already participating and get deposit amount
     * @param {number} userId - ID of the participating user
     * @param {number} eventId - ID of the event
     * @returns {Promise<Participation|null>} Participation record or null if not found
     * @throws {ApiError} Database error if operation fails
     */
    async findByUserAndEvent(userId, eventId) {
        try {
            return await ParticipationRepository.findByUserAndEvent(userId, eventId);
        } catch (e) {
            throw ApiError.database('Error finding participation by user and event', e);
        }
    }

    /**
     * Finds a participation by ID with all associated data
     * Used for detailed participation information retrieval
     * @param {number} participationId - ID of the participation record
     * @returns {Promise<Participation>} Participation with user and event details
     * @throws {ApiError} Database error if participation not found or operation fails
     */
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

    /**
     * Finds all participations for a specific user
     * Used for user participation history and portfolio display
     * @param {number} userId - ID of the user
     * @returns {Promise<Participation[]>} Array of user's participations with event details
     * @throws {ApiError} Database error if operation fails
     */
    async findByUser(userId) {
        try {
            return await ParticipationRepository.findByUser(userId);
        } catch (e) {
            throw ApiError.database('Error finding participations by user', e);
        }
    }

    /**
     * Finds all participations in a specific event
     * Used for event participant listing and management
     * @param {number} eventId - ID of the event
     * @returns {Promise<Participation[]>} Array of participations with user details
     * @throws {ApiError} Database error if operation fails
     */
    async findByEvent(eventId) {
        try {
            return await ParticipationRepository.findByEvent(eventId);
        } catch (e) {
            throw ApiError.database('Error finding participations by event', e);
        }
    }

    /**
     * Updates an existing participation record
     * Used primarily for deposit amount changes and status updates
     * @param {number} participationId - ID of the participation to update
     * @param {Object} updateData - Data to update (deposit, status, etc.)
     * @returns {Promise<Participation>} Updated participation with associations
     * @throws {ApiError} Database error if participation not found or update fails
     */
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