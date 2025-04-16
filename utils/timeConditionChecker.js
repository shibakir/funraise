const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkAndUpdateEventStatus } = require('./helpers/conditionHelpers');

async function checkTimeConditions() {
    try {
        // Получаем все end conditions с parameterName "time"
        const timeConditions = await prisma.endCondition.findMany({
            where: {
                parameterName: "time",
                isCompleted: false
            },
            include: {
                eventEndCondition: true
            }
        });

        const currentTime = new Date();
        // Отслеживаем, какие eventId были затронуты
        const affectedEventIds = new Set();

        for (const condition of timeConditions) {
            const conditionTime = new Date(condition.value);
            const eventId = condition.eventEndCondition.eventId;
            
            if (currentTime >= conditionTime) {
                // Добавляем eventId в список затронутых
                affectedEventIds.add(eventId);
                
                // Обновляем isCompleted для EndCondition
                await prisma.endCondition.update({
                    where: { id: condition.id },
                    data: { isCompleted: true }
                });

                // Проверяем, все ли условия для EventEndCondition выполнены
                const allConditions = await prisma.endCondition.findMany({
                    where: { endConditionId: condition.endConditionId }
                });

                const allCompleted = allConditions.every(c => c.isCompleted);

                if (allCompleted) {
                    // Обновляем isCompleted для EventEndCondition
                    await prisma.eventEndCondition.update({
                        where: { id: condition.endConditionId },
                        data: { isCompleted: true }
                    });
                }
            }
        }

        // Для каждого затронутого события проверяем, нужно ли обновить его статус
        for (const eventId of affectedEventIds) {
            await checkAndUpdateEventStatus(eventId);
        }

        return { success: true, message: "Time conditions checked successfully" };
    } catch (error) {
        console.error("Error checking time conditions:", error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    checkTimeConditions
}; 