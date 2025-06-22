// Lazy loading to avoid circular dependency
let eventService = null;
let userService = null;

function getEventService() {
    if (!eventService) {
        eventService = require('../../service').eventService;
    }
    return eventService;
}

function getUserService() {
    if (!userService) {
        userService = require('../../service').userService;
    }
    return userService;
}

/**
 * Utility for tracking event completion and updating achievements
 */
class EventCompletionTracker {

    /**
     * Handle event completion
     * @param {number} eventId - Event ID
     */
    async handleEventCompletion(eventId) {
        try {
            const event = await getEventService().findByIdWithParticipants(eventId);

            if (!event) {
                throw new Error(`Event with ID ${eventId} not found`);
            }

            // Get all event participants
            const participants = event.participations || [];
            const participantsCount = participants.length;

            // Calculate the total bank of the event (sum of all participants' deposits)
            const totalBank = participants.reduce((sum, participation) => {
                return sum + (participation.deposit || 0);
            }, 0);

            // Calculate the income per participant
            const incomePerParticipant = participantsCount > 0 ? totalBank / participantsCount : 0;

            const eventData = {
                bankAmount: totalBank,
                participantsCount: participantsCount,
                completedAt: new Date(),
                userIncome: incomePerParticipant
            };

            // Update achievements for each participant
            for (const participation of participants) {
                const userId = participation.user.id;
                
                // Track event completion
                const { onEventCompleted } = require('./index');
                await onEventCompleted(userId, eventId, eventData);
            }

            // Also update achievements for the event creator (if he is not a participant)
            const creatorIsParticipant = participants.some(p => p.user.id === event.userId);
            if (!creatorIsParticipant && event.userId) {
                const { onEventCompleted } = require('./index');
                await onEventCompleted(event.userId, eventId, eventData);
            }

            //console.log(`Event ${eventId} completed with ${participantsCount} participants and bank ${totalBank}`);

        } catch (error) {
            //console.error('Error handling event completion:', error);
            throw error;
        }
    }

    /**
     * Handle user participation in an event
     * @param {number} userId - User ID
     * @param {number} eventId - Event ID
     * @param {number} amount - Deposit amount
     */
    async handleEventParticipation(userId, eventId, amount) {
        try {
            // Отслеживаем участие в событии
            const { onEventParticipated } = require('./index');
            await onEventParticipated(userId, eventId);

            //console.log(`User ${userId} participated in event ${eventId} with deposit ${amount}`);

        } catch (error) {
            //console.error('Error handling event participation:', error);
            throw error;
        }
    }

    /**
     * Check and update achievements for user activity
     * @param {number} userId - User ID
     */
    async updateUserActivityStreak(userId) {
        try {

            // just for example
            const streakDays = await this.calculateActivityStreak(userId);
            
            if (streakDays > 0) {
                const { onUserActivityUpdated } = require('./index');
                await onUserActivityUpdated(userId, streakDays);
            }

        } catch (error) {
            //console.error('Error updating user activity:', error);
            throw error;
        }
    }

    /**
     * Calculate the number of consecutive activity days
     * @param {number} userId - User ID
     * @returns {number} Number of consecutive activity days
     */
    async calculateActivityStreak(userId) {
        try {
            
            // just for example
            const events = await getEventService().findByUser(userId, 30);

            // Simple count - number of days with activity
            const activeDays = new Set();
            events.forEach(event => {
                const day = event.createdAt.toISOString().split('T')[0];
                activeDays.add(day);
            });

            return activeDays.size;

        } catch (error) {
            //console.error('Error calculating activity:', error);
            return 0;
        }
    }

    /**
     * Bulk update achievements for all users
     * Useful for migrations or periodic updates
     */
    async bulkUpdateAchievements() {
        try {
            const users = await getUserService().getAllUsers();
            
            for (const user of users) {
                await this.updateUserActivityStreak(user.id);
                
                // You can add other bulk updates
                const userBalance = await getUserService().findByIdWithBalance(user.id);
                if (userBalance) {
                    const { onUserBankUpdated } = require('./index');
                    await onUserBankUpdated(user.id, userBalance.balance);
                }
            }

            //console.log(`Achievements updated for ${users.length} users`);

        } catch (error) {
            //console.error('Error updating achievements:', error);
            throw error;
        }
    }
}

module.exports = new EventCompletionTracker(); 