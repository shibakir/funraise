const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

        for (const condition of timeConditions) {
            const conditionTime = new Date(condition.value);
            
            if (currentTime >= conditionTime) {
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

        return { success: true, message: "Time conditions checked successfully" };
    } catch (error) {
        console.error("Error checking time conditions:", error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    checkTimeConditions
}; 