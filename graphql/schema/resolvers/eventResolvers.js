const { eventService, userService, participationService, eventEndConditionService } = require('../../../service');
const { pubsub, SUBSCRIPTION_EVENTS } = require('../../pubsub');
const createEventSchema = require('../../../validation/schema/EventSchema');
const { handleServiceError } = require('../../utils/errorHandler');

/**
 * GraphQL resolvers for Event-related operations
 * Handles queries, mutations, and field resolvers for event management
 */
const eventResolvers = {
    Query: {
        /**
         * Retrieves a specific event by its ID with all related data
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Query arguments
         * @param {number} args.id - Event ID to fetch
         * @returns {Promise<Event|null>} Event object with end conditions or null if not found
         */
        event: async (_, { id }) => {
            try {
                return await eventService.findById(id, true);
            } catch (error) {
                console.error('Error fetching event:', error);
                return null;
            }
        },

        /**
         * Retrieves all events in the system with their end conditions
         * @param {Object} _ - Parent object (unused)
         * @param {Object} __ - Query arguments (unused)
         * @returns {Promise<Event[]>} Array of all events with their end conditions
         */
        events: async () => {
            try {
                return await eventService.findAll(true);
            } catch (error) {
                console.error('Error fetching events:', error);
                return [];
            }
        }
    },

    Mutation: {
        /**
         * Creates a new event with specified parameters and end conditions
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {Object} args.input - Event creation data
         * @param {string} args.input.name - Event name/title
         * @param {string} [args.input.description] - Event description
         * @param {string} args.input.type - Event type/category
         * @param {string} [args.input.imageFile] - Base64 encoded image
         * @param {number} args.input.userId - ID of user creating the event
         * @param {number} [args.input.recipientId] - ID of user who will receive rewards
         * @param {Array} args.input.eventEndConditionGroups - Groups of end conditions
         * @returns {Promise<Event>} Created event object with all related data
         * @throws {Error} If event creation fails or validation errors occur
         */
        createEvent: async (_, { input }) => {
            try {
                const { error } = createEventSchema.validate(input);
                if (error) {
                    throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
                }

                const event = await eventService.create(input);
                
                // Retrieve complete event information with all associations
                const fullEvent = await eventService.findById(event.id, true);

                // Publish real-time update for event creation
                pubsub.publish(SUBSCRIPTION_EVENTS.EVENT_UPDATED, {
                    eventUpdated: fullEvent
                });

                return fullEvent;
            } catch (error) {
                console.error('Error creating event:', error);
                handleServiceError(error, 'Failed to create event');
            }
        }
    },

    /**
     * Field resolvers for Event type
     * These resolvers handle nested field resolution and computed fields for Event objects
     */
    Event: {
        /**
         * Calculates the total bank amount from all participations
         * @param {Event} event - Parent Event object
         * @returns {Promise<number>} Total amount deposited by all participants
         */
        bankAmount: async (event) => {
            try {
                return await eventService.calculateBankAmount(event.id);
            } catch (error) {
                console.error('Error calculating bank amount:', error);
                return 0;
            }
        },

        /**
         * Resolves all end condition groups for the event
         * @param {Event} event - Parent Event object
         * @returns {Promise<EventEndCondition[]>} Array of end condition groups with their conditions
         */
        endConditions: async (event) => {
            try {
                return await eventEndConditionService.findByEventId(event.id);
            } catch (error) {
                console.error('Error fetching end conditions:', error);
                return [];
            }
        },

        /**
         * Resolves the user who created this event
         * @param {Event} event - Parent Event object
         * @returns {Promise<User|null>} Creator user object or null if no creator
         */
        creator: async (event) => {
            if (!event.userId) return null;
            try {
                return await userService.findById(event.userId, false);
            } catch (error) {
                console.error('Error fetching event creator:', error);
                return null;
            }
        },

        /**
         * Resolves the user who will receive rewards from this event
         * @param {Event} event - Parent Event object
         * @returns {Promise<User|null>} Recipient user object or null if no recipient
         */
        recipient: async (event) => {
            if (!event.recipientId) return null;
            try {
                return await userService.findById(event.recipientId, false);
            } catch (error) {
                console.error('Error fetching event recipient:', error);
                return null;
            }
        },

        /**
         * Resolves all user participations in this event
         * @param {Event} event - Parent Event object
         * @returns {Promise<Participation[]>} Array of participations with user details
         */
        participations: async (event) => {
            try {
                return await participationService.findByEvent(event.id);
            } catch (error) {
                console.error('Error fetching event participations:', error);
                return [];
            }
        }
    },

    /**
     * Field resolvers for EventEndCondition type
     * Handles resolution of individual conditions within condition groups
     */
    EventEndCondition: {
        /**
         * Resolves all individual conditions within an end condition group
         * @param {EventEndCondition} eventEndCondition - Parent EventEndCondition object
         * @returns {Promise<EndCondition[]>} Array of individual conditions in this group
         */
        conditions: async (eventEndCondition) => {
            try {
                if (eventEndCondition.conditions) return eventEndCondition.conditions;
                
                const { endConditionService } = require('../../../service');
                return await endConditionService.findByEventEndCondition(eventEndCondition.id);
            } catch (error) {
                console.error('Error fetching conditions:', error);
                return [];
            }
        }
    }
};

module.exports = eventResolvers; 