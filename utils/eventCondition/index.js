const EventConditionTracker = require('./EventConditionTracker');

// Create a single instance of the tracker
const eventConditionTracker = new EventConditionTracker();

/**
 * Main export for use in services
 * Contains all necessary methods for working with event conditions
 */
module.exports = {
    // Main tracker (singleton)
    eventConditionTracker,
    
    // Class for extending functionality
    EventConditionTracker,

    // Convenient methods for direct use

    /**
     * Check all conditions of an event
     * @param {number} eventId - ID события
     */
    async checkEventConditions(eventId) {
        return await eventConditionTracker.checkAllEventConditions(eventId);
    },

    /**
     * Called when a new participant is added to an event
     * @param {number} eventId - Event ID
     * @param {number} userId - User ID
     * @param {number} deposit - Deposit amount
     */
    async onParticipationAdded(eventId, userId, deposit) {
        //console.log(`New participant ${userId} added to event ${eventId} with deposit ${deposit}`);
        await eventConditionTracker.checkAllEventConditions(eventId);
    },

    /**
     * Called when participation is updated (e.g., change of deposit)
     * @param {number} eventId - Event ID
     * @param {number} userId - User ID
     * @param {number} newDeposit - New deposit amount
     */
    async onParticipationUpdated(eventId, userId, newDeposit) {
        //console.log(`Deposit of user ${userId} in event ${eventId} updated to ${newDeposit}`);
        await eventConditionTracker.checkAllEventConditions(eventId);
    },

    /**
     * Called periodically to check time conditions
     * @param {number} eventId - Event ID (optional, if not specified - all active events are checked)
     */
    async onTimeCheck(eventId = null) {
        if (eventId) {
            //console.log(`Checking time conditions for event ${eventId}`);
            await eventConditionTracker.checkAllEventConditions(eventId);
        } else {
            //console.log(`Periodic check of time conditions for all active events`);
            // Here you can add logic to get all active events
            // and check their time conditions
        }
    },

    /**
     * Called when an event is created to initialize tracking
     * @param {number} eventId - ID of the new event
     */
    async onEventCreated(eventId) {
        //console.log(`Started tracking conditions for new event ${eventId}`);
        await eventConditionTracker.checkAllEventConditions(eventId);
    },

    /**
     * Force check a specific condition
     * @param {number} endConditionId - Condition ID
     * @param {number} eventId - Event ID
     */
    async checkSpecificCondition(endConditionId, eventId) {
        await eventConditionTracker.checkAndUpdateEndCondition(endConditionId, eventId);
    },

    /**
     * Get information about the current state of conditions of an event
     * @param {number} eventId - Event ID
     * @returns {Object} Conditions status
     */
    async getEventConditionsStatus(eventId) {
        try {
            // Lazy loading to avoid circular dependency
            const { EventService } = require('../../service');
            const event = await EventService.findByIdWithEndConditions(eventId);
            
            if (!event) {
                throw new Error(`Event ${eventId} not found`);
            }

            const status = {
                eventId: eventId,
                eventStatus: event.status,
                conditionGroups: []
            };

            for (const group of event.endConditions) {
                const groupStatus = {
                    groupId: group.id,
                    isCompleted: group.isCompleted,
                    isFailed: group.isFailed,
                    conditions: []
                };

                for (const condition of group.conditions) {
                    const currentValue = await eventConditionTracker.getCurrentValue(condition, eventId);
                    groupStatus.conditions.push({
                        conditionId: condition.id,
                        name: condition.name,
                        operator: condition.operator,
                        targetValue: condition.value,
                        currentValue: currentValue,
                        isCompleted: condition.isCompleted
                    });
                }

                status.conditionGroups.push(groupStatus);
            }

            return status;
        } catch (error) {
            //console.error('Error getting the status of conditions of an event:', error);
            throw error;
        }
    }
}; 