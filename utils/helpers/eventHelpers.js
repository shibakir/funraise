const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculates the percentage of condition completion for each EventEndCondition of event
 * @param {number} eventId - ID of event
 * @returns {Promise<number[]>} - Array of completion percentages for each EventEndCondition
 */
const calculateEndConditionsProgress = async (eventId) => {
    try {
        // Get all EventEndCondition for event
        const eventEndConditions = await prisma.eventEndCondition.findMany({
            where: { eventId: parseInt(eventId) },
            include: {
                conditions: true
            }
        });
        
        // If event has no conditions, return empty array
        if (!eventEndConditions.length) {
            return [];
        }
        
        // For each group of conditions, calculate the percentage of completed
        return eventEndConditions.map(group => {
            const totalConditions = group.conditions.length;
            if (totalConditions === 0) return 0;
            
            const completedConditions = group.conditions.filter(condition => condition.isCompleted).length;
            return Math.round((completedConditions / totalConditions) * 100);
        });
    } catch (error) {
        console.error(`Ошибка при расчете прогресса условий: ${error.message}`);
        return [];
    }
};

/**
 * Transfers funds after event completion
 * @param {number} eventId - ID of event
 * @returns {Promise<boolean>} - true, if funds transfer is successful
 */
const transferFundsAfterEvent = async (eventId) => {
    try {
        const parsedEventId = parseInt(eventId);
        
        // Get event with bank
        const event = await prisma.event.findUnique({
            where: { id: parsedEventId },
            include: {
                participations: true
            }
        });
        
        if (!event) {
            throw new Error(`Event with ID ${parsedEventId} not found`);
        }
        
        // ID of platform admin (recipient of commission)
        const platformAdminId = 0;
        
        // Execute transfer of funds depending on event type
        await prisma.$transaction(async (tx) => {
            let recipientId = event.recipientId;
            let recipientAmount = 0;
            let platformAmount = 0;
            
            switch (event.type) {
                case 'FUNDRAISING':
                    // 96% creator, 4% platform
                    recipientId = event.userId;
                    recipientAmount = event.bankAmount * 0.96;
                    platformAmount = event.bankAmount * 0.04;
                    break;
                    
                case 'DONATION':
                    // 92% creator, 8% platform
                    recipientId = event.userId;
                    recipientAmount = event.bankAmount * 0.92;
                    platformAmount = event.bankAmount * 0.08;
                    break;
                    
                case 'JACKPOT':
                    // Determine winner
                    if (event.participations.length > 0) {
                        // Calculate total bank
                        const totalBank = event.bankAmount;
                        
                        // Calculate coefficients for each participant
                        const participantsWithCoef = event.participations.map(participation => {
                            const share = participation.deposit / totalBank;
                            // 0.7 * share + 0.3 * random number from 0 to 1
                            const coefficient = (share * 0.7) + (Math.random() * 0.3);
                            return {
                                userId: participation.userId,
                                coefficient
                            };
                        });
                        
                        // Sort by descending coefficient and select winner
                        participantsWithCoef.sort((a, b) => b.coefficient - a.coefficient);
                        recipientId = participantsWithCoef[0].userId;
                        
                        // 90% winner, 10% platform
                        recipientAmount = event.bankAmount * 0.9;
                        platformAmount = event.bankAmount * 0.1;
                        
                        console.log('Winner of jackpot: ', recipientId);

                        // Update recipient in event
                        await tx.event.update({
                            where: { id: parsedEventId },
                            data: { recipientId }
                        });
                    }
                    break;
                    
                default:
                    throw new Error(`Unknown event type: ${event.type}`);
            }

            console.log('Recipient amount: ', recipientAmount);
            console.log('Platform amount: ', platformAmount);
            console.log('Recipient ID: ', recipientId);
            
            // Create transaction for winner
            if (recipientAmount > 0 && recipientId) {
                await tx.transaction.create({
                    data: {
                        amount: recipientAmount,
                        userId: recipientId,
                        type: 'EVENT_WIN'
                    }
                });
            }
            /*
            // Create transaction for platform (commission)
            if (platformAmount > 0) {
                await tx.transaction.create({
                    data: {
                        amount: platformAmount,
                        userId: platformAdminId,
                        type: 'PLATFORM_FEE'
                    }
                });
            }
            */
        });
        
        return true;
    } catch (error) {
        console.error(`Error transferring funds after event: ${error.message}`);
        return false;
    }
};

module.exports = {
    calculateEndConditionsProgress,
    transferFundsAfterEvent
}; 