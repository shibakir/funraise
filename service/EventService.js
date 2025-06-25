const ApiError = require('../exception/ApiError');
const { EventRepository } = require('../repository');

const EventEndConditionService = require('./EventEndConditionService');
const { onEventCreated } = require('../utils/achievement');
const eventConditions = require('../utils/eventCondition');
const { firebaseStorageService } = require('../utils/media/FirebaseStorageService');
const { FILE_LIMITS, EVENT_TYPES, CONDITION_TYPES } = require('../constants');

/**
 * Service layer for event management and lifecycle operations
 * Handles event creation, image uploads, condition management, participant tracking,
 * achievement integration, and background processing for time-based conditions
 */
class EventService {

    /**
     * Creates a new event with comprehensive validation, image upload, and condition setup
     * Integrates with achievement system and initializes condition tracking
     * @param {Object} data - Event creation data
     * @param {string} data.name - Name/title of the event
     * @param {string} [data.description] - Optional event description
     * @param {string} data.type - Event type from EVENT_TYPES constants
     * @param {string} [data.imageFile] - Base64 encoded image file
     * @param {number} data.userId - ID of the user creating the event
     * @param {number} [data.recipientId] - ID of recipient user (auto-set for donations)
     * @param {Array} data.eventEndConditionGroups - Array of condition groups
     * @returns {Promise<Event>} Created event object
     * @throws {ApiError} Bad request for validation errors or upload failures
     */
    async create(data) {
        try {
            const { name, description, type, imageFile, userId, recipientId: inputRecipientId, eventEndConditionGroups } = data;

            // Validate that at least one end condition group is provided
            if (eventEndConditionGroups.length === 0) {
                throw ApiError.badRequest('Event end condition groups are required');
            }

            let imageUrl = null;
            if (imageFile) {
                try {
                    // Decode base64 image data
                    const base64Data = imageFile.replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    // Validate file size against configured limits
                    if (buffer.length > FILE_LIMITS.MAX_IMAGE_SIZE) {
                        throw ApiError.badRequest(`Image size must not exceed ${FILE_LIMITS.MAX_IMAGE_SIZE / 1024 / 1024}MB`);
                    }
                    
                    // Create file object compatible with Firebase storage
                    const file = {
                        buffer: buffer,
                        originalname: `event-${Date.now()}.jpg`,
                        mimetype: 'image/jpeg'
                    };

                    // Upload to Firebase Storage with organized path structure
                    const firebasePath = `events/${userId}/${Date.now()}.jpg`;
                    imageUrl = await firebaseStorageService.uploadImage(file, firebasePath);
                    
                    //console.log('Image uploaded to Firebase:', imageUrl);
                } catch (uploadError) {
                    console.error('Error uploading image to Firebase:', uploadError);
                    if (uploadError instanceof ApiError) {
                        throw uploadError;
                    }
                    throw ApiError.badRequest('Failed to upload image: ' + uploadError.message);
                }
            }

            let recipientId = null;

            // Auto-assign recipient for donation/fundraising events
            if (inputRecipientId) {
                recipientId = inputRecipientId;
            } else if (type === EVENT_TYPES.DONATION || type === EVENT_TYPES.FUNDRAISING) {
                recipientId = userId;
            }

            // Create the main event record
            const event = await EventRepository.create({
                name: name,
                description: description,
                type: type,
                imageUrl: imageUrl,
                userId: userId,
                recipientId: recipientId,
            });

            // Create all end condition groups and their individual conditions
            for (const group of eventEndConditionGroups) {
                await EventEndConditionService.create({
                    eventId: event.id,
                    conditions: group.conditions
                });
            }

            // Track event creation for achievement system (non-blocking)
            await onEventCreated(userId, event.id);

            // Initialize event condition tracking system (non-blocking)
            await eventConditions.onEventCreated(event.id);

            return event;
        } catch (e) {
            throw ApiError.badRequest(e.message);
        }
    }

    /**
     * Finds an event by ID with all participant information and balances
     * Used for detailed event analysis and participant management
     * @param {number} eventId - ID of the event
     * @returns {Promise<Event>} Event with participations and user data
     * @throws {ApiError} Bad request if event not found or operation fails
     */
    async findByIdWithParticipants(eventId) {
        try {
            return await EventRepository.findByIdWithParticipants(eventId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event with participants', e.message);
        }
    }

    /**
     * Finds all events created by a specific user
     * Used for user profile and event history display
     * @param {number} userId - ID of the user who created the events
     * @param {number} limit - Maximum number of events to return (default: 30)
     * @returns {Promise<Event[]>} Array of user's events ordered by creation date
     * @throws {ApiError} Bad request if operation fails
     */
    async findByUser(userId, limit = 30) {
        try {
            return await EventRepository.findByUser(userId, limit);
        } catch (e) {
            throw ApiError.badRequest('Error finding events by user', e.message);
        }
    }

    /**
     * Updates the status of an event
     * Used for event lifecycle management (start, complete, cancel, etc.)
     * @param {number} eventId - ID of the event to update
     * @param {string} status - New status value from EVENT_STATUSES constants
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Bad request if event not found or update fails
     */
    async updateStatus(eventId, status) {
        try {
            return await EventRepository.updateStatus(eventId, status);
        } catch (e) {
            throw ApiError.badRequest('Error updating event status', e.message);
        }
    }

    /**
     * Finds an event by ID with all end conditions and their criteria
     * Used for event completion evaluation and condition checking
     * @param {number} eventId - ID of the event
     * @returns {Promise<Event>} Event with complete end condition hierarchy
     * @throws {ApiError} Bad request if event not found or operation fails
     */
    async findByIdWithEndConditions(eventId) {
        try {
            return await EventRepository.findByIdWithEndConditions(eventId);
        } catch (e) {
            throw ApiError.badRequest('Error finding event with end conditions', e.message);
        }
    }

    /**
     * Background job to check time-based conditions for all active events
     * Runs periodically to evaluate if events should end based on time criteria
     * Processes each active event and triggers condition evaluation if needed
     * @returns {Promise<void>} Completes when all time checks are done
     * @throws {ApiError} Bad request if time checking process fails
     */
    async checkTimeConditions() {
        try {
            
            // Retrieve all events that are currently in progress
            const activeEvents = await EventRepository.findActiveEvents();

            // Process each active event for time condition evaluation
            for (const event of activeEvents) {
                if (event.endConditions && event.endConditions.length > 0) {
                    // Check if this event has any time-based conditions
                    const hasTimeConditions = event.endConditions.some(group => 
                        group.conditions && group.conditions.some(condition => condition.name === CONDITION_TYPES.TIME)
                    );
                    
                    if (hasTimeConditions) {
                        
                        // Import eventConditions here to avoid circular dependencies
                        const eventConditions = require('../utils/eventCondition');
                        await eventConditions.onTimeCheck(event.id);
                    }
                }
            }

            //console.log('Time conditions check completed');
        } catch (e) {
            console.error('Error checking time conditions:', e.message);
            throw ApiError.badRequest('Error checking time conditions', e.message);
        }
    }

    /**
     * Finds an event by ID with optional end conditions loading
     * Provides performance control over associated data loading
     * @param {number} eventId - ID of the event
     * @param {boolean} includeEndConditions - Whether to load end conditions (default: true)
     * @returns {Promise<Event>} Event with or without end conditions
     * @throws {ApiError} Database error if event not found
     */
    async findById(eventId, includeEndConditions = true) {
        try {
            return await EventRepository.findByIdWithOptionalEndConditions(eventId, includeEndConditions);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding event by ID', e);
        }
    }

    /**
     * Finds all events with optional end conditions loading
     * Used for event listing with performance optimization
     * @param {boolean} includeEndConditions - Whether to load end conditions (default: true)
     * @returns {Promise<Event[]>} Array of all events
     * @throws {ApiError} Database error if operation fails
     */
    async findAll(includeEndConditions = true) {
        try {
            return await EventRepository.findAllWithOptionalEndConditions(includeEndConditions);
        } catch (e) {
            throw ApiError.database('Error finding all events', e);
        }
    }

    /**
     * Finds the creator user of a specific event
     * Used for permission checks and event ownership validation
     * @param {number} eventId - ID of the event
     * @returns {Promise<User|null>} Creator user or null if no creator
     * @throws {ApiError} Database error if operation fails
     */
    async findCreator(eventId) {
        try {
            return await EventRepository.findCreator(eventId);
        } catch (e) {
            throw ApiError.database('Error finding event creator', e);
        }
    }

    /**
     * Finds the recipient user of a specific event
     * Used for reward distribution and notification purposes
     * @param {number} eventId - ID of the event
     * @returns {Promise<User|null>} Recipient user or null if no recipient
     * @throws {ApiError} Database error if operation fails
     */
    async findRecipient(eventId) {
        try {
            return await EventRepository.findRecipient(eventId);
        } catch (e) {
            throw ApiError.database('Error finding event recipient', e);
        }
    }

    /**
     * Finds all participations in a specific event
     * Used for event participant listing and management
     * @param {number} eventId - ID of the event
     * @returns {Promise<Participation[]>} Array of participations with user details
     * @throws {ApiError} Database error if operation fails
     */
    async findParticipations(eventId) {
        try {
            const { ParticipationRepository } = require('../repository');
            return await ParticipationRepository.findByEvent(eventId);
        } catch (e) {
            throw ApiError.database('Error finding event participations', e);
        }
    }

    /**
     * Calculates the total bank amount from all participations in an event
     * Efficiently sums all participant deposits without loading unnecessary data
     * @param {number} eventId - ID of the event
     * @returns {Promise<number>} Total deposited amount across all participants
     * @throws {ApiError} Database error if calculation fails
     */
    async calculateBankAmount(eventId) {
        try {
            const { ParticipationRepository } = require('../repository');
            const participations = await ParticipationRepository.findByEventForCalculation(eventId);

            return participations.reduce((total, participation) => {
                return total + (participation.deposit || 0);
            }, 0);
        } catch (e) {
            throw ApiError.database('Error calculating bank amount', e);
        }
    }

}

module.exports = new EventService();