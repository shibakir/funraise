const { PubSub } = require('graphql-subscriptions');

// Создаем глобальный экземпляр PubSub
const pubsub = new PubSub();

// Константы для типов событий
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