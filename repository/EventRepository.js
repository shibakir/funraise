const BaseRepository = require('./BaseRepository');
const { Event, EventEndCondition, EndCondition, Participation, User } = require('../model');
const { EVENT_STATUSES, CONDITION_TYPES } = require('../constants');

/**
 * Repository for managing events and their complex relationships
 * Handles event creation, participant management, end conditions, and status tracking
 * Events are the core entity around which users participate and earn rewards
 */
class EventRepository extends BaseRepository {
    /**
     * Initializes the Event repository with the Event model
     */
    constructor() {
        super(Event);
    }

    /**
     * Finds an event by ID with all participant information
     * Used for event management and participant analysis
     * @param {number} eventId - ID of the event
     * @returns {Promise<Event>} Event with participations and user balance data
     * @throws {ApiError} Not found error if event doesn't exist
     */
    async findByIdWithParticipants(eventId) {
        return await this.findByPk(eventId, {
            include: [
                {
                    model: Participation,
                    as: 'participations',
                    include: [{ 
                        model: User, 
                        as: 'user',
                        // Only load essential user data for performance
                        attributes: ['id', 'balance'] 
                    }]
                }
            ]
        });
    }

    /**
     * Finds all events created by a specific user
     * Used for user profile and event history display
     * @param {number} userId - ID of the user who created the events
     * @param {number} limit - Maximum number of events to return (default: 30)
     * @returns {Promise<Event[]>} Array of events ordered by creation date (newest first)
     */
    async findByUser(userId, limit = 30) {
        return await this.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit
        });
    }

    /**
     * Finds an event by ID with all end conditions and their criteria
     * Used for event completion evaluation and condition checking
     * @param {number} eventId - ID of the event
     * @returns {Promise<Event>} Event with complete end condition hierarchy
     * @throws {ApiError} Not found error if event doesn't exist
     */
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

    /**
     * Finds an event by ID with optional end conditions loading
     * Used when end conditions are not always needed for performance optimization
     * @param {number} eventId - ID of the event
     * @param {boolean} includeEndConditions - Whether to load end conditions (default: true)
     * @returns {Promise<Event>} Event with or without end conditions based on parameter
     * @throws {ApiError} Not found error if event doesn't exist
     */
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

    /**
     * Finds all events with optional end conditions loading
     * Used for event listing with performance control over associated data
     * @param {boolean} includeEndConditions - Whether to load end conditions (default: true)
     * @returns {Promise<Event[]>} Array of all events with or without end conditions
     */
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

    /**
     * Finds the creator user of a specific event
     * Used for permission checks and event ownership validation
     * @param {number} eventId - ID of the event
     * @returns {Promise<User|null>} Creator user or null if event has no creator
     * @throws {ApiError} Not found error if event doesn't exist
     */
    async findCreator(eventId) {
        const event = await this.findByPk(eventId, {
            include: [{ 
                model: User, 
                as: 'creator' 
            }]
        });
        return event ? event.creator : null;
    }

    /**
     * Finds the recipient user of a specific event
     * Used for reward distribution and notification purposes
     * @param {number} eventId - ID of the event
     * @returns {Promise<User|null>} Recipient user or null if event has no recipient
     * @throws {ApiError} Not found error if event doesn't exist
     */
    async findRecipient(eventId) {
        const event = await this.findByPk(eventId, {
            include: [{ 
                model: User, 
                as: 'recipient' 
            }]
        });
        return event ? event.recipient : null;
    }

    /**
     * Finds all currently active events with time-based end conditions
     * Used for background processing and automatic event completion checking
     * @returns {Promise<Event[]>} Array of in-progress events with time conditions
     */
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
                    // Use left join to include events even if they don't have time conditions
                    required: false
                }]
            }]
        });
    }

    /**
     * Updates the status of an event
     * Used for event lifecycle management (start, complete, cancel, etc.)
     * @param {number} eventId - ID of the event to update
     * @param {string} status - New status value from EVENT_STATUSES constants
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if event doesn't exist or database error
     */
    async updateStatus(eventId, status) {
        return await this.update(eventId, { status });
    }
}

module.exports = new EventRepository(); 