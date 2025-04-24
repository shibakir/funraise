const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Рассчитывает процент выполнения условий для каждого EventEndCondition события
 * @param {number} eventId - ID события
 * @returns {Promise<number[]>} - Массив процентов выполнения для каждого EventEndCondition
 */
const calculateEndConditionsProgress = async (eventId) => {
    try {
        // Получаем все EventEndCondition для события
        const eventEndConditions = await prisma.eventEndCondition.findMany({
            where: { eventId: parseInt(eventId) },
            include: {
                conditions: true
            }
        });
        
        // Если у события нет условий, возвращаем пустой массив
        if (!eventEndConditions.length) {
            return [];
        }
        
        // Для каждой группы условий считаем процент выполненных
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

module.exports = {
    calculateEndConditionsProgress
}; 