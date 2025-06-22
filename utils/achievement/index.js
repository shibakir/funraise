const { CriterionManager, EventCriterionTracker, UserCriterionTracker, AchievementTracker } = require('./CriterionTrackers');
const EventCompletionTracker = require('./EventCompletionTracker');

// Create a single instance of the criterion manager
const criterionManager = new CriterionManager();

/**
 * Main export for use in services
 * Contains all necessary methods for working with achievements
 */
module.exports = {
    // Main manager (singleton)
    criterionManager,
    
    // Classes for extending functionality
    CriterionManager,
    EventCriterionTracker,
    UserCriterionTracker,
    AchievementTracker,
    EventCompletionTracker,

    // Convenient methods for direct use
    async initializeUser(userId) {
        return await criterionManager.initializeUser(userId);
    },

    async getUserAchievements(userId) {
        return await criterionManager.getUserAchievements(userId);
    },

    // Events
    async onEventCompleted(userId, eventId, eventData) {
        return await criterionManager.onEventCompleted(userId, eventId, eventData);
    },

    async onEventCreated(userId, eventId) {
        return await criterionManager.onEventCreated(userId, eventId);
    },

    async onEventParticipated(userId, eventId) {
        return await criterionManager.onEventParticipated(userId, eventId);
    },

    // User
    async onUserActivityUpdated(userId, streakDays) {
        return await criterionManager.onUserActivityUpdated(userId, streakDays);
    },

    async onUserBankUpdated(userId, newBankAmount) {
        return await criterionManager.onUserBankUpdated(userId, newBankAmount);
    }
}; 