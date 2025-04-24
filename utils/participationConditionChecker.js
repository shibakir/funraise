const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { compareValues, checkAndUpdateEventStatus } = require('./helpers/conditionHelpers');

/**
 * Сервис для проверки условий окончания событий
 */
const participationConditionChecker = {
    /**
     * Проверяет условия окончания события, связанные с количеством участников
     * @param {number} eventId - ID события
     * @returns {Promise<void>}
     */
    async checkPeopleConditions(eventId) {
        try {
            // Получаем количество участников для данного события
            const participationsCount = await prisma.participation.count({
                where: { eventId: parseInt(eventId) }
            });
            
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
                // Находим условия с параметром "people"
                const peopleConditions = endCondition.conditions.filter(
                    condition => condition.parameterName === "people" && !condition.isCompleted
                );
                
                // Проверяем каждое условие "people"
                for (const condition of peopleConditions) {
                    const conditionValue = parseInt(condition.value);
                    
                    // Используем вспомогательную функцию для сравнения значений
                    const isConditionMet = compareValues(condition.operator, participationsCount, conditionValue);
                    
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
            console.error(`Ошибка при проверке условий по количеству участников: ${error.message}`);
        }
    }
};

module.exports = participationConditionChecker;