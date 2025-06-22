const { withFilter } = require('graphql-subscriptions');
const { pubsub, SUBSCRIPTION_EVENTS } = require('../../pubsub');
const { eventService, userService, participationService, eventEndConditionService } = require('../../../service');

const subscriptionResolvers = {
    Subscription: {
        eventUpdated: {
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.EVENT_UPDATED]),
                (payload, variables) => {
                    return payload.eventUpdated.id === variables.eventId;
                }
            ),
            resolve: async (payload) => {
                try {
                    // Return full event information
                    return await eventService.findById(payload.eventUpdated.id, true);
                } catch (error) {
                    console.error('Error fetching event for subscription:', error);
                    return null;
                }
            }
        },

        participationCreated: {
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.PARTICIPATION_CREATED]),
                (payload, variables) => {
                    return payload.participationCreated.eventId === variables.eventId;
                }
            ),
            resolve: async (payload) => {
                try {
                    // Return full participation information
                    return await participationService.findById(payload.participationCreated.id);
                } catch (error) {
                    console.error('Error fetching participation for subscription:', error);
                    return null;
                }
            }
        },

        participationUpdated: {
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.PARTICIPATION_UPDATED]),
                (payload, variables) => {
                    return payload.participationUpdated.eventId === variables.eventId;
                }
            ),
            resolve: async (payload) => {
                try {
                    // Return full participation information
                    return await participationService.findById(payload.participationUpdated.id);
                } catch (error) {
                    console.error('Error fetching participation for subscription:', error);
                    return null;
                }
            }
        },

        balanceUpdated: {
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.BALANCE_UPDATED]),
                (payload, variables) => {
                    return payload.balanceUpdated.id === variables.userId;
                }
            ),
            resolve: async (payload) => {
                try {
                    // Return full user information
                    return await userService.findById(payload.balanceUpdated.id, true);
                } catch (error) {
                    console.error('Error fetching user for subscription:', error);
                    return null;
                }
            }
        },

        eventConditionsUpdated: {
            subscribe: withFilter(
                () => pubsub.asyncIterator([SUBSCRIPTION_EVENTS.EVENT_CONDITIONS_UPDATED]),
                (payload, variables) => {
                    return payload.eventConditionsUpdated.eventId === variables.eventId;
                }
            ),
            resolve: async (payload) => {
                try {
                    // Return updated event conditions
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