const { PubSub } = require('graphql-subscriptions');

// Create a global instance of PubSub
const pubsub = new PubSub();

// Constants for event types
const SUBSCRIPTION_EVENTS = {
    EVENT_UPDATED: 'EVENT_UPDATED',
    PARTICIPATION_CREATED: 'PARTICIPATION_CREATED',
    PARTICIPATION_UPDATED: 'PARTICIPATION_UPDATED',
    BALANCE_UPDATED: 'BALANCE_UPDATED',
    EVENT_CONDITIONS_UPDATED: 'EVENT_CONDITIONS_UPDATED'
};

module.exports = {
    pubsub,
    SUBSCRIPTION_EVENTS
}; 