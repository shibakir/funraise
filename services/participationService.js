const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

/**
 * Сервис для работы с участием пользователей в событиях
 */
const participationService = {
    /**
     * Получение всех записей об участии
     * @returns {Promise<Array>} - Массив всех участий
     */
    async getAllParticipations() {
        return await prismaClient.participation.findMany({
            include: {
                user: true,
                event: true
            }
        });
    },
    
    /**
     * Получение участия по ID
     * @param {number} id - ID участия
     * @returns {Promise<Object>} - Данные участия
     */
    async getParticipationById(id) {
        const participation = await prismaClient.participation.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: true,
                event: true
            }
        });
        
        if (!participation) {
            throw new Error('Participation not found');
        }
        
        return participation;
    },
    
    /**
     * Создание нового участия
     * @param {Object} participationData - Данные участия
     * @returns {Promise<Object>} - Созданное участие
     */
    async createParticipation(participationData) {
        const { deposit, userId, eventId } = participationData;
        
        // Проверяем существование пользователя и события
        const [user, event] = await Promise.all([
            prismaClient.user.findUnique({ where: { id: parseInt(userId) } }),
            prismaClient.event.findUnique({ where: { id: parseInt(eventId) } })
        ]);
        
        if (!user) {
            throw new Error('User not found');
        }
        if (!event) {
            throw new Error('Event not found');
        }
        
        // Проверяем, не участвует ли уже пользователь в этом событии
        const existingParticipation = await prismaClient.participation.findFirst({
            where: {
                userId: parseInt(userId),
                eventId: parseInt(eventId)
            }
        });
        
        if (existingParticipation) {
            throw new Error('User already participates in this event');
        }
        
        // Начинаем транзакцию
        return await prismaClient.$transaction(async (prisma) => {
            // Создаем участие
            const newParticipation = await prisma.participation.create({
                data: {
                    deposit: parseFloat(deposit),
                    userId: parseInt(userId),
                    eventId: parseInt(eventId)
                },
                include: {
                    user: true,
                    event: true
                }
            });
            
            // Обновляем сумму в банке события
            await prisma.event.update({
                where: { id: parseInt(eventId) },
                data: {
                    bankAmount: {
                        increment: parseFloat(deposit)
                    }
                }
            });
            
            return newParticipation;
        });
    },
    
    /**
     * Обновление участия
     * @param {number} id - ID участия
     * @param {Object} participationData - Обновляемые данные
     * @returns {Promise<Object>} - Обновленное участие
     */
    async updateParticipation(id, participationData) {
        const { deposit } = participationData;
        
        // Проверяем существование участия
        const participation = await prismaClient.participation.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!participation) {
            throw new Error('Participation not found');
        }
        
        // Начинаем транзакцию
        return await prismaClient.$transaction(async (prisma) => {
            // Обновляем участие
            const updatedParticipation = await prisma.participation.update({
                where: { id: parseInt(id) },
                data: {
                    deposit: parseFloat(deposit)
                },
                include: {
                    user: true,
                    event: true
                }
            });
            
            // Обновляем сумму в банке события
            const depositDiff = parseFloat(deposit) - participation.deposit;
            await prisma.event.update({
                where: { id: participation.eventId },
                data: {
                    bankAmount: {
                        increment: depositDiff
                    }
                }
            });
            
            return updatedParticipation;
        });
    },
    
    /**
     * Удаление участия
     * @param {number} id - ID участия
     * @returns {Promise<void>}
     */
    async deleteParticipation(id) {
        // Проверяем существование участия
        const participation = await prismaClient.participation.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!participation) {
            throw new Error('Participation not found');
        }
        
        // Начинаем транзакцию
        await prismaClient.$transaction(async (prisma) => {
            // Удаляем участие
            await prisma.participation.delete({
                where: { id: parseInt(id) }
            });
            
            // Обновляем сумму в банке события
            await prisma.event.update({
                where: { id: participation.eventId },
                data: {
                    bankAmount: {
                        decrement: participation.deposit
                    }
                }
            });
        });
    }
};

module.exports = participationService; 