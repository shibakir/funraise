const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { transferFundsAfterEvent } = require('./eventHelpers');

/**
 * Сравнивает два значения на основе указанного оператора
 * @param {string} operator - Оператор сравнения (<, <=, >, >=, =, ==)
 * @param {number} actualValue - Фактическое значение
 * @param {number} conditionValue - Целевое значение из условия
 * @returns {boolean} - Результат сравнения
 * @throws {Error} - В случае недопустимого оператора
 */
const compareValues = (operator, actualValue, conditionValue) => {
    try {
        switch (operator) {
            case "lt":
                return actualValue < conditionValue;
            case "lte":
                return actualValue <= conditionValue;
            case "gt":
                return actualValue > conditionValue;
            case "gte":
                return actualValue >= conditionValue;
            case "eq":
                return actualValue === conditionValue;
            default:
                throw new Error(`Unsupported operator: ${operator}`);
        }
    } catch (error) {
        console.error(`Error on comparison values: ${error.message}`);
        // По умолчанию считаем, что условие не выполнено
        return false;
    }
};

/**
 * Checks event end conditions and updates event status if necessary
 * @param {number} eventId - ID of event
 * @returns {Promise<boolean>} - true, if all conditions are met and event status is updated
 */
const checkAndUpdateEventStatus = async (eventId) => {
    try {
        // Check if event ID is passed and is a number
        if (!eventId || isNaN(parseInt(eventId))) {
            throw new Error('Invalid event ID.');
        }
        
        const parsedEventId = parseInt(eventId);

        // Get event
        const event = await prisma.event.findUnique({
            where: { id: parsedEventId }
        });
        
        if (!event) {
            throw new Error(`Event with ID ${parsedEventId} not found`);
        }
        
        // Get all groups of end conditions for event
        const eventEndConditions = await prisma.eventEndCondition.findMany({
            where: { eventId: parsedEventId }
        });
        
        // If event has no end conditions, just return
        if (eventEndConditions.length === 0) {
            return false;
        }
        
        // Check if there is at least one fully completed group of conditions
        const completedGroup = eventEndConditions.find(group => group.isCompleted);
        
        if (completedGroup) {
            // Execute all actions within a transaction
            await prisma.$transaction(async (tx) => {
                // Update event status to COMPLETED
                await tx.event.update({
                    where: { id: parsedEventId },
                    data: { status: 'completed' }
                });
            });
            
            // Call function to transfer funds after event completion
            await transferFundsAfterEvent(parsedEventId);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error on check event status: ${error.message}`);
        return false;
    }
};

module.exports = {
    compareValues,
    checkAndUpdateEventStatus
}; 