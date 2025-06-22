const AchievementTracker = require('./AchievementTracker');
const { User, Event, Participation, Transaction } = require('../../model');

/**
 * Base class for tracking criteria
 */
class BaseCriterionTracker {
    constructor() {
        this.achievementTracker = new AchievementTracker();
    }
}

/**
 * Tracking criteria related to events
 */
class EventCriterionTracker extends BaseCriterionTracker {
    
    /**
     * Update progress when event is completed with completed bank condition
     * @param {number} userId - User ID
     * @param {number} eventId - Event ID
     * @param {number} bankAmount - Event bank amount
     */
    async trackEventBankCompleted(userId, eventId, bankAmount) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'EVENT_BANK_COMPLETED', 
                bankAmount, 
                { updateType: 'max' }
            );
        } catch (error) {
            //console.error('Error tracking EVENT_BANK_COMPLETED:', error);
        }
    }

    /**
     * Update progress when event is completed with a certain number of participants
     * @param {number} userId - User ID
     * @param {number} eventId - Event ID
     * @param {number} participantsCount - Number of participants
     */
    async trackEventPeopleCompleted(userId, eventId, participantsCount) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'EVENT_PEOPLE_COMPLETED', 
                participantsCount, 
                { updateType: 'max' }
            );
        } catch (error) {
            //console.error('Error tracking EVENT_PEOPLE_COMPLETED:', error);
        }
    }

    /**
     * Update progress when event is completed at a certain time
     * @param {number} userId - User ID
     * @param {number} eventId - Event ID
     * @param {Date} completedAt - Time of completion
     */
    async trackEventTimeCompleted(userId, eventId, completedAt) {
        try {
            // Здесь может быть логика проверки временных условий
            await this.achievementTracker.updateProgress(
                userId, 
                'EVENT_TIME_COMPLETED', 
                1, 
                { updateType: 'increment' }
            );
        } catch (error) {
            //console.error('Error tracking EVENT_TIME_COMPLETED:', error);
        }
    }

    /**
     * Update progress when event is completed with a certain income
     * @param {number} userId - User ID
     * @param {number} eventId - Event ID
     * @param {number} income - Income
     */
    async trackEventIncomeOnetime(userId, eventId, income) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'EVENT_INCOME_ONETIME', 
                income, 
                { updateType: 'max' }
            );
        } catch (error) {
            //console.error('Error tracking EVENT_INCOME_ONETIME:', error);
        }
    }

    /**
     * Update progress when event is completed with a certain income
     * @param {number} userId - User ID
     * @param {number} income - Income
     */
    async trackEventIncomeAll(userId, income) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'EVENT_INCOME_ALL', 
                income, 
                { updateType: 'increment' }
            );
        } catch (error) {
            //console.error('Error tracking EVENT_INCOME_ALL:', error);
        }
    }

    /**
     * Update progress when event is completed with a certain income
     * @param {number} userId - User ID
     */
    async trackEventCountAll(userId) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'EVENT_COUNT_ALL', 
                1, 
                { updateType: 'increment' }
            );
        } catch (error) {
            //console.error('Error tracking EVENT_COUNT_ALL:', error);
        }
    }

    /**
     * Update progress when event is created
     * @param {number} userId - User ID
     */
    async trackEventCountCreated(userId) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'EVENT_COUNT_CREATED', 
                1, 
                { updateType: 'increment' }
            );
        } catch (error) {
            //console.error('Error tracking EVENT_COUNT_CREATED:', error);
        }
    }

    /**
     * Update progress when event is completed
     * @param {number} userId - User ID
     */
    async trackEventCountCompleted(userId) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'EVENT_COUNT_COMPLETED', 
                1, 
                { updateType: 'increment' }
            );
        } catch (error) {
            //console.error('Error tracking EVENT_COUNT_COMPLETED:', error);
        }
    }
}

/**
 * Tracking criteria related to user
 */
class UserCriterionTracker extends BaseCriterionTracker {
    
    /**
     * Update progress when user is active
     * @param {number} userId - User ID
     * @param {number} streakDays - Number of consecutive days
     */
    async trackUserActivity(userId, streakDays) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'USER_ACTIVITY', 
                streakDays, 
                { updateType: 'max' }
            );
        } catch (error) {
            //console.error('Error tracking USER_ACTIVITY:', error);
        }
    }

    /**
     * Update progress when user's bank is updated
     * @param {number} userId - User ID
     * @param {number} bankAmount - Current bank amount
     */
    async trackUserBank(userId, bankAmount) {
        try {
            await this.achievementTracker.updateProgress(
                userId, 
                'USER_BANK', 
                bankAmount, 
                { updateType: 'set' }
            );
        } catch (error) {
            //console.error('Error tracking USER_BANK:', error);
        }
    }
}

/**
 * Main manager for all criterion types
 */
class CriterionManager {
    constructor() {
        this.eventTracker = new EventCriterionTracker();
        this.userTracker = new UserCriterionTracker();
        this.achievementTracker = new AchievementTracker();
    }

    /**
     * Initialize achievements for a new user
     * @param {number} userId - User ID
     */
    async initializeUser(userId) {
        return await this.achievementTracker.initializeUserAchievements(userId);
    }

    /**
     * Get all achievements for a user
     * @param {number} userId - User ID
     */
    async getUserAchievements(userId) {
        return await this.achievementTracker.getUserAchievements(userId);
    }

    // Methods for events
    async onEventCompleted(userId, eventId, eventData) {
        const { bankAmount, participantsCount, completedAt, userIncome } = eventData;

        // Track different event criteria
        if (bankAmount) {
            await this.eventTracker.trackEventBankCompleted(userId, eventId, bankAmount);
        }
        
        if (participantsCount) {
            await this.eventTracker.trackEventPeopleCompleted(userId, eventId, participantsCount);
        }
        
        if (completedAt) {
            await this.eventTracker.trackEventTimeCompleted(userId, eventId, completedAt);
        }
        
        if (userIncome) {
            await this.eventTracker.trackEventIncomeOnetime(userId, eventId, userIncome);
            await this.eventTracker.trackEventIncomeAll(userId, userIncome);
        }

        await this.eventTracker.trackEventCountCompleted(userId);
        await this.eventTracker.trackEventCountAll(userId);
    }

    async onEventCreated(userId, eventId) {
        await this.eventTracker.trackEventCountCreated(userId);
        await this.eventTracker.trackEventCountAll(userId);
    }

    async onEventParticipated(userId, eventId) {
        await this.eventTracker.trackEventCountAll(userId);
    }

    // Methods for user
    async onUserActivityUpdated(userId, streakDays) {
        await this.userTracker.trackUserActivity(userId, streakDays);
    }

    async onUserBankUpdated(userId, newBankAmount) {
        await this.userTracker.trackUserBank(userId, newBankAmount);
    }
}

module.exports = {
    CriterionManager,
    EventCriterionTracker,
    UserCriterionTracker,
    AchievementTracker
}; 