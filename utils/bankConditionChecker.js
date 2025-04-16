const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { compareValues, checkAndUpdateEventStatus } = require('./helpers/conditionHelpers');

/**
 * Сервис для проверки условий окончания событий по сумме в банке
 */
const bankConditionChecker = {
    /**
     * Проверяет условия окончания события, связанные с суммой в банке
     * @param {number} eventId - ID события
     * @returns {Promise<void>}
     */
    async checkBankConditions(eventId) {
        try {
            // Получаем сумму всех депозитов для данного события
            const participations = await prisma.participation.findMany({
                where: { eventId: parseInt(eventId) }
            });
            
            const totalBank = participations.reduce((sum, participation) => sum + participation.deposit, 0);
            
            // Получаем все EventEndConditions для события, которые еще не выполнены
            const eventEndConditions = await prisma.eventEndCondition.findMany({
                where: { 
                    eventId: parseInt(eventId),
                    isCompleted: false
                },
                include: {
                    conditions: true
                }
            });
            
            // Проверяем каждое условие
            for (const endCondition of eventEndConditions) {
                // Находим условия с параметром "bank"
                const bankConditions = endCondition.conditions.filter(
                    condition => condition.parameterName === "bank" && !condition.isCompleted
                );
                
                // Проверяем каждое условие "bank"
                for (const condition of bankConditions) {
                    const conditionValue = parseFloat(condition.value);
                    
                    // Используем вспомогательную функцию для сравнения значений
                    const isConditionMet = compareValues(condition.operator, totalBank, conditionValue);
                    
                    // Если условие выполнено, обновляем его статус
                    if (isConditionMet) {
                        await prisma.endCondition.update({
                            where: { id: condition.id },
                            data: { isCompleted: true }
                        });
                    }
                }
                
                // Проверяем, все ли условия для этого EventEndCondition выполнены
                const allConditions = await prisma.endCondition.findMany({
                    where: { endConditionId: endCondition.id }
                });
                
                const allCompleted = allConditions.every(c => c.isCompleted);
                
                // Если все условия выполнены, обновляем статус EventEndCondition
                if (allCompleted) {
                    await prisma.eventEndCondition.update({
                        where: { id: endCondition.id },
                        data: { isCompleted: true }
                    });
                }
            }
            
            // Проверяем, нужно ли обновить статус события
            await checkAndUpdateEventStatus(eventId);
            
        } catch (error) {
            console.error(`Ошибка при проверке условий по банку: ${error.message}`);
        }
    }
};

module.exports = bankConditionChecker; 