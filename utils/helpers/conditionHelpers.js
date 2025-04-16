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
            case "<":
                return actualValue < conditionValue;
            case "<=":
                return actualValue <= conditionValue;
            case ">":
                return actualValue > conditionValue;
            case ">=":
                return actualValue >= conditionValue;
            case "==":
            case "=":
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
            throw new Error('Недопустимый ID события');
        }
        
        const parsedEventId = parseInt(eventId);
        
        // Получаем событие
        const event = await prisma.event.findUnique({
            where: { id: parsedEventId }
        });
        
        if (!event) {
            throw new Error(`Событие с ID ${parsedEventId} не найдено`);
        }
        
        // Проверяем, находится ли событие все еще в активном состоянии
        if (event.status !== 'ACTIVE') {
            return false;
        }
        
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
                data: { status: 'COMPLETED' }
            });
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Ошибка проверки статуса события: ${error.message}`);
        return false;
    }
};

module.exports = {
    compareValues,
    checkAndUpdateEventStatus
}; 