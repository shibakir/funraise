const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
                throw new Error(`Неподдерживаемый оператор: ${operator}`);
        }
    } catch (error) {
        console.error(`Ошибка сравнения значений: ${error.message}`);
        // По умолчанию считаем, что условие не выполнено
        return false;
    }
};

/**
 * Проверяет условия окончания события и обновляет статус события при необходимости
 * @param {number} eventId - ID события
 * @returns {Promise<boolean>} - true, если все условия выполнены и статус события обновлен
 */
const checkAndUpdateEventStatus = async (eventId) => {
    try {
        // Проверяем, что ID события передан и является числом
        if (!eventId || isNaN(parseInt(eventId))) {
            throw new Error('Invalid event ID.');
        }
        
        const parsedEventId = parseInt(eventId);

        // Получаем событие
        const event = await prisma.event.findUnique({
            where: { id: parsedEventId }
        });
        
        if (!event) {
            throw new Error(`Event with ID ${parsedEventId} not found`);
        }
        
        // Проверяем, находится ли событие все еще в активном состоянии
        //if (event.status !== 'active') {
        //    return false;
        //}
        
        // Получаем все группы условий окончания для события
        const eventEndConditions = await prisma.eventEndCondition.findMany({
            where: { eventId: parsedEventId }
        });
        
        // Если у события нет условий окончания, просто выходим
        if (eventEndConditions.length === 0) {
            return false;
        }
        
        // Проверяем, есть ли хотя бы одна полностью выполненная группа условий
        const completedGroup = eventEndConditions.find(group => group.isCompleted);
        
        if (completedGroup) {
            // Обновляем статус события на COMPLETED
            await prisma.event.update({
                where: { id: parsedEventId },
                data: { status: 'completed' }
            });
            
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