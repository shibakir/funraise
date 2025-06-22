// Lazy loading to avoid circular dependency
let eventService = null;
let eventEndConditionService = null;
let endConditionService = null;
let participationService = null;
let pubsub = null;
let SUBSCRIPTION_EVENTS = null;

function getEventService() {
    if (!eventService) {
        eventService = require('../../service').eventService;
    }
    return eventService;
}

function getEventEndConditionService() {
    if (!eventEndConditionService) {
        eventEndConditionService = require('../../service').eventEndConditionService;
    }
    return eventEndConditionService;
}

function getEndConditionService() {
    if (!endConditionService) {
        endConditionService = require('../../service').endConditionService;
    }
    return endConditionService;
}

function getParticipationService() {
    if (!participationService) {
        participationService = require('../../service').participationService;
    }
    return participationService;
}

function getPubSub() {
    if (!pubsub || !SUBSCRIPTION_EVENTS) {
        const pubSubModule = require('../../graphql/pubsub');
        pubsub = pubSubModule.pubsub;
        SUBSCRIPTION_EVENTS = pubSubModule.SUBSCRIPTION_EVENTS;
    }
    return { pubsub, SUBSCRIPTION_EVENTS };
}

/**
 * Base class for tracking event conditions
 */
class EventConditionTracker {

    /**
     * Check a specific condition (EndCondition)
     * @param {Object} endCondition - Condition to check
     * @param {number} currentValue - Current value
     * @returns {boolean} Is the condition met
     */
    checkCondition(endCondition, currentValue) {
        const targetValue = parseFloat(endCondition.value);
        
        switch (endCondition.operator) {
            case 'EQUALS':
                return currentValue === targetValue;
            case 'GREATER':
                return currentValue > targetValue;
            case 'LESS':
                return currentValue < targetValue;
            case 'GREATER_EQUALS':
                return currentValue >= targetValue;
            case 'LESS_EQUALS':
                return currentValue <= targetValue;
            default:
                //console.error('Unknown operator:', endCondition.operator);
                return false;
        }
    }

    /**
     * Get the current value for the PEOPLE criterion (number of participants)
     * @param {number} eventId - Event ID
     * @returns {number} Number of participants
     */
    async getPeopleCount(eventId) {
        try {
            const event = await getEventService().findByIdWithParticipants(eventId);
            return event ? (event.participations ? event.participations.length : 0) : 0;
        } catch (error) {
            //console.error('Error getting the number of participations:', error);
            return 0;
        }
    }

    /**
     * Get the current value for the BANK criterion (total deposit amount)
     * @param {number} eventId - Event ID
     * @returns {number} Total deposit amount
     */
    async getBankAmount(eventId) {
        try {
            const event = await getEventService().findByIdWithParticipants(eventId);
            if (!event || !event.participations) {
                return 0;
            }

            return event.participations.reduce((total, participation) => {
                return total + (participation.deposit || 0);
            }, 0);
        } catch (error) {
            //console.error('Error getting the bank amount:', error);
            return 0;
        }
    }

    /**
     * Get the current value for the TIME criterion (time check)
     * @param {number} eventId - Event ID
     * @param {string} timeValue - Target time in ISO format
     * @returns {boolean} Is the time reached
     */
    async getTimeCondition(eventId, timeValue) {
        try {
            const targetDate = new Date(timeValue);
            const currentDate = new Date();
            return currentDate >= targetDate;
        } catch (error) {
            //console.error('Error checking the time:', error);
            return false;
        }
    }

    /**
     * Get the current value for the condition depending on its type
     * @param {Object} endCondition - Condition
     * @param {number} eventId - Event ID
     * @returns {number|boolean} Current value
     */
    async getCurrentValue(endCondition, eventId) {
        const conditionType = endCondition.name; // Теперь это enum ConditionType

        switch (conditionType) {
            case 'PARTICIPATION':
                return await this.getPeopleCount(eventId);
            
            case 'BANK':
                return await this.getBankAmount(eventId);
            
            case 'TIME':
                // For time, return 1 if the condition is met, 0 if not
                const isTimeReached = await this.getTimeCondition(eventId, endCondition.value);
                return isTimeReached ? 1 : 0;
            
            default:
                //console.warn('Unknown condition type:', endCondition.name);
                return 0;
        }
    }

    /**
     * Check and update the status of a specific condition
     * @param {number} endConditionId - Condition ID
     * @param {number} eventId - Event ID
     */
    async checkAndUpdateEndCondition(endConditionId, eventId) {
        try {
            const endCondition = await getEndConditionService().findById(endConditionId);
            if (!endCondition) {
                //console.error('Condition not found:', endConditionId);
                return;
            }

            if (endCondition.isCompleted) {
                return; // Condition is already completed
            }

            const currentValue = await this.getCurrentValue(endCondition, eventId);
            const isCompleted = this.checkCondition(endCondition, currentValue);

            if (isCompleted) {
                await getEndConditionService().updateCompletion(endConditionId, true);
                //console.log(`Condition ${endCondition.name} completed for event ${eventId}`);
                
                // Check the group of conditions
                await this.checkAndUpdateEventEndCondition(endCondition.endConditionId, eventId);
            } else {
                // Special handling for time conditions - if time has passed, check if group should fail
                if (endCondition.name === 'TIME') {
                    const timeReached = await this.getTimeCondition(eventId, endCondition.value);
                    if (timeReached) {
                        // Time deadline reached, check if this group should be marked as failed
                        await this.checkGroupFailureOnTimeDeadline(endCondition.endConditionId, eventId);
                    }
                }
            }
        } catch (error) {
            //console.error('Error checking the condition:', error);
        }
    }

    /**
     * Check if group should be marked as failed when time deadline is reached
     * @param {number} eventEndConditionId - Group of conditions ID
     * @param {number} eventId - Event ID
     */
    async checkGroupFailureOnTimeDeadline(eventEndConditionId, eventId) {
        try {
            const eventEndCondition = await getEventEndConditionService().findById(eventEndConditionId);
            if (!eventEndCondition || eventEndCondition.isCompleted || eventEndCondition.isFailed) {
                return; // Already completed or failed
            }

            // Get all conditions of the group
            const conditions = await getEndConditionService().findByEventEndCondition(eventEndConditionId);
            
            // Check if there are non-time conditions that are not completed
            const nonTimeConditions = conditions.filter(condition => {
                return condition.name !== 'TIME';
            });

            const hasUncompletedNonTimeConditions = nonTimeConditions.some(condition => !condition.isCompleted);

                    if (hasUncompletedNonTimeConditions) {
            // Mark group as failed since deadline passed but other conditions not met
            await getEventEndConditionService().updateFailure(eventEndConditionId, true);
            //console.log(`Group of conditions ${eventEndConditionId} failed due to time deadline for event ${eventId}`);
            
            // Publish event conditions update
            try {
                const { pubsub, SUBSCRIPTION_EVENTS } = getPubSub();
                pubsub.publish(SUBSCRIPTION_EVENTS.EVENT_CONDITIONS_UPDATED, {
                    eventConditionsUpdated: { eventId: eventId }
                });
            } catch (pubsubError) {
                //console.error('Error publishing event conditions update:', pubsubError);
            }
            
            // Check if the event should be marked as failed
            await this.checkAndUpdateEvent(eventId);
        }
        } catch (error) {
            //console.error('Error checking group failure on time deadline:', error);
        }
    }

    /**
     * Check and update the status of a group of conditions (EventEndCondition)
     * @param {number} eventEndConditionId - Group of conditions ID
     * @param {number} eventId - Event ID
     */
    async checkAndUpdateEventEndCondition(eventEndConditionId, eventId) {
        try {
            const eventEndCondition = await getEventEndConditionService().findById(eventEndConditionId);
            if (!eventEndCondition) {
                //console.error('Group of conditions not found:', eventEndConditionId);
                return;
            }

            if (eventEndCondition.isCompleted || eventEndCondition.isFailed) {
                return; // Group of conditions is already completed or failed
            }

            // Get all conditions of the group
            const conditions = await getEndConditionService().findByEventEndCondition(eventEndConditionId);
            
            // Check if all conditions are completed
            const allCompleted = conditions.every(condition => condition.isCompleted);

            if (allCompleted && conditions.length > 0) {
                await getEventEndConditionService().updateCompletion(eventEndConditionId, true);
                //console.log(`Group of conditions ${eventEndConditionId} completed for event ${eventId}`);
                
                // Publish event conditions update
                try {
                    const { pubsub, SUBSCRIPTION_EVENTS } = getPubSub();
                    pubsub.publish(SUBSCRIPTION_EVENTS.EVENT_CONDITIONS_UPDATED, {
                        eventConditionsUpdated: { eventId: eventId }
                    });
                } catch (pubsubError) {
                    //console.error('Error publishing event conditions update:', pubsubError);
                }
                
                // Check the event
                await this.checkAndUpdateEvent(eventId);
            }
        } catch (error) {
            //console.error('Error checking the group of conditions:', error);
        }
    }

    /**
     * Check and update the status of an event
     * @param {number} eventId - Event ID
     */
    async checkAndUpdateEvent(eventId) {
        try {
            const event = await getEventService().findByIdWithEndConditions(eventId);
            if (!event) {
                //console.error('Event not found:', eventId);
                return;
            }

            if (event.status === 'FINISHED' || event.status === 'FAILED') {
                return; // Event is already finished or failed
            }

            // Check if at least one group of conditions is completed
            const hasCompletedGroup = event.endConditions.some(group => group.isCompleted);
            
            // Check if all groups have either completed or failed
            const allGroupsResolved = event.endConditions.every(group => group.isCompleted || group.isFailed);

            let statusChanged = false;

            if (hasCompletedGroup) {
                await getEventService().updateStatus(eventId, 'FINISHED');
                //console.log(`Event ${eventId} completed!`);
                statusChanged = true;
                
                // Here you can add additional logic when the event is completed
                await this.onEventCompleted(eventId);
            } else if (allGroupsResolved && event.endConditions.length > 0) {
                // All groups failed, event cannot be completed
                await getEventService().updateStatus(eventId, 'FAILED');
                //console.log(`Event ${eventId} finished - all condition groups failed!`);
                statusChanged = true;
                
                await this.onEventFailed(eventId);
            }

            // Publish event update to subscribers if status changed
            if (statusChanged) {
                try {
                    const { pubsub, SUBSCRIPTION_EVENTS } = getPubSub();
                    pubsub.publish(SUBSCRIPTION_EVENTS.EVENT_UPDATED, {
                        eventUpdated: { id: eventId }
                    });
                    //console.log(`Published event status update for event ${eventId}`);
                } catch (pubsubError) {
                    //console.error('Error publishing event update:', pubsubError);
                }
            }
        } catch (error) {
            //console.error('Error checking the event:', error);
        }
    }

    /**
     * Handle the completion of an event
     * @param {number} eventId - Completed event ID
     */
    async onEventCompleted(eventId) {
        try {
            //console.log(`Event ${eventId} completed!`);
        } catch (error) {
            //console.error('Error handling the completion of an event:', error);
        }
    }

    /**
     * Handle the failure of an event (all condition groups failed)
     * @param {number} eventId - Failed event ID
     */
    async onEventFailed(eventId) {
        try {
            //console.log(`Event ${eventId} failed - all condition groups failed!`);
        } catch (error) {
            //console.error('Error handling the failure of an event:', error);
        }
    }

    /**
     * Check all conditions of an event when data changes
     * @param {number} eventId - Event ID
     */
    async checkAllEventConditions(eventId) {
        try {
            const eventEndConditions = await getEventEndConditionService().findByEventWithConditions(eventId);
            
            for (const eventEndCondition of eventEndConditions) {
                if (!eventEndCondition.isCompleted && !eventEndCondition.isFailed && eventEndCondition.conditions) {
                    for (const condition of eventEndCondition.conditions) {
                        if (!condition.isCompleted) {
                            await this.checkAndUpdateEndCondition(condition.id, eventId);
                        }
                    }
                }
            }
        } catch (error) {
            //console.error('Error checking all conditions of an event:', error);
        }
    }
}

module.exports = EventConditionTracker; 