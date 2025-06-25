const { withFilter } = require('graphql-subscriptions');
const { pubsub, SUBSCRIPTION_EVENTS } = require('../../pubsub');
const { eventService, userService, participationService, eventEndConditionService } = require('../../../service');

/**
 * GraphQL subscription resolvers for real-time updates
 * Handles WebSocket connections for live data updates across different entities
 */
const subscriptionResolvers = {
    Subscription: {
        /**
         * Real-time subscription for event updates
         * Notifies subscribers when an event is modified (participations, status, etc.)
         * @param {Object} payload - Subscription payload containing event data
         * @param {Object} variables - Subscription variables
         * @param {number} variables.eventId - ID of the event to subscribe to
         * @returns {Promise<Event|null>} Updated event object with full details
         */
        eventUpdated: {
            // Filter subscription to only notify for specific event ID
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.EVENT_UPDATED]),
                (payload, variables) => {
                    // Only send updates for the subscribed event
                    return payload.eventUpdated.id === variables.eventId;
                }
            ),
            // Resolve function to fetch complete event data when update occurs
            resolve: async (payload) => {
                try {
                    // Return complete event information with all associations
                    return await eventService.findById(payload.eventUpdated.id, true);
                } catch (error) {
                    console.error('Error fetching event for subscription:', error);
                    return null;
                }
            }
        },

        /**
         * Real-time subscription for new participations in an event
         * Notifies subscribers when a new user joins an event
         * @param {Object} payload - Subscription payload containing participation data
         * @param {Object} variables - Subscription variables
         * @param {number} variables.eventId - ID of the event to monitor for new participations
         * @returns {Promise<Participation|null>} New participation object with user details
         */
        participationCreated: {
            // Filter subscription to only notify for specific event's new participations
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.PARTICIPATION_CREATED]),
                (payload, variables) => {
                    // Only send updates for participations in the subscribed event
                    return payload.participationCreated.eventId === variables.eventId;
                }
            ),
            // Resolve function to fetch complete participation data
            resolve: async (payload) => {
                try {
                    // Return complete participation information with associations
                    return await participationService.findById(payload.participationCreated.id);
                } catch (error) {
                    console.error('Error fetching participation for subscription:', error);
                    return null;
                }
            }
        },

        /**
         * Real-time subscription for participation updates in an event
         * Notifies subscribers when existing participations are modified (deposit changes)
         * @param {Object} payload - Subscription payload containing participation data
         * @param {Object} variables - Subscription variables
         * @param {number} variables.eventId - ID of the event to monitor for participation updates
         * @returns {Promise<Participation|null>} Updated participation object with user details
         */
        participationUpdated: {
            // Filter subscription to only notify for specific event's participation updates
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.PARTICIPATION_UPDATED]),
                (payload, variables) => {
                    // Only send updates for participations in the subscribed event
                    return payload.participationUpdated.eventId === variables.eventId;
                }
            ),
            // Resolve function to fetch updated participation data
            resolve: async (payload) => {
                try {
                    // Return complete participation information with associations
                    return await participationService.findById(payload.participationUpdated.id);
                } catch (error) {
                    console.error('Error fetching participation for subscription:', error);
                    return null;
                }
            }
        },

        /**
         * Real-time subscription for user balance updates
         * Notifies subscribers when a user's balance changes due to transactions
         * @param {Object} payload - Subscription payload containing user data
         * @param {Object} variables - Subscription variables
         * @param {number} variables.userId - ID of the user to monitor for balance changes
         * @returns {Promise<User|null>} Updated user object with current balance
         */
        balanceUpdated: {
            // Filter subscription to only notify for specific user's balance changes
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.BALANCE_UPDATED]),
                (payload, variables) => {
                    // Only send updates for the subscribed user
                    return payload.balanceUpdated.id === variables.userId;
                }
            ),
            // Resolve function to fetch updated user data with current balance
            resolve: async (payload) => {
                try {
                    // Return complete user information with updated balance
                    return await userService.findById(payload.balanceUpdated.id, true);
                } catch (error) {
                    console.error('Error fetching user for subscription:', error);
                    return null;
                }
            }
        },

        /**
         * Real-time subscription for event condition updates
         * Notifies subscribers when event end conditions are evaluated or completed
         * @param {Object} payload - Subscription payload containing event condition data
         * @param {Object} variables - Subscription variables
         * @param {number} variables.eventId - ID of the event to monitor for condition updates
         * @returns {Promise<EventEndCondition[]>} Array of updated event end conditions
         */
        eventConditionsUpdated: {
            // Filter subscription to only notify for specific event's condition updates
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.EVENT_CONDITIONS_UPDATED]),
                (payload, variables) => {
                    // Only send updates for conditions of the subscribed event
                    return payload.eventConditionsUpdated.eventId === variables.eventId;
                }
            ),
            // Resolve function to fetch updated event conditions
            resolve: async (payload) => {
                try {
                    // Return updated event end conditions with all details
                    return await eventEndConditionService.findByEventId(payload.eventConditionsUpdated.eventId);
                } catch (error) {
                    console.error('Error fetching event conditions for subscription:', error);
                    return [];
                }
            }
        }
    }
};

module.exports = subscriptionResolvers; 