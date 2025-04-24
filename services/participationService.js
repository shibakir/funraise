const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const userService = require('./userService');
const participationConditionChecker = require('../utils/participationConditionChecker');
const bankConditionChecker = require('../utils/bankConditionChecker');
const transactionService = require('./transactionService');

/**
 * Сервис для работы с участием пользователей в событиях
 */
const participationService = {
    /**
     * Получение всех записей об участии
     * @returns {Promise<Array>} - Массив всех участий
     */
    async getAllParticipations() {
        return prismaClient.participation.findMany({
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
        
        // Проверяем, достаточно ли средств у пользователя
        const hasEnoughBalance = await userService.checkUserBalance(userId, deposit);
        if (!hasEnoughBalance) {
            throw new Error('Insufficient funds');
        }
        
        // Начинаем транзакцию
        let newParticipation = prismaClient.$transaction(async (prisma) => {
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
            
            // Создаем отрицательную транзакцию для пользователя
            await prisma.transaction.create({
                data: {
                    amount: -Math.abs(parseFloat(deposit)),
                    userId: parseInt(userId)
                }
            });
            return newParticipation;
        });

        // Проверяем условия окончания события по количеству участников
        await participationConditionChecker.checkPeopleConditions(eventId);
        // Проверяем условия окончания события по сумме в банке
        await bankConditionChecker.checkBankConditions(eventId);
        return newParticipation;
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
            where: { id: parseInt(id) },
            include: { user: true }
        });
        
        if (!participation) {
            throw new Error('Participation not found');
        }
        
        // Проверяем, достаточно ли средств у пользователя
        const hasEnoughBalance = await userService.checkUserBalance(participation.userId, deposit);
        if (!hasEnoughBalance) {
            throw new Error('Insufficient funds');
        }
        
        // Начинаем транзакцию
        let updatedParticipation = prismaClient.$transaction(async (prisma) => {
            // Получаем текущую сумму депозита
            const currentDeposit = participation.deposit;
            
            // Увеличиваем сумму депозита на указанное значение
            const newDeposit = currentDeposit + parseFloat(deposit);
            
            // Обновляем участие
            const updatedParticipation = await prisma.participation.update({
                where: { id: parseInt(id) },
                data: {
                    deposit: newDeposit
                },
                include: {
                    user: true,
                    event: true
                }
            });
            
            // Обновляем сумму в банке события
            await prisma.event.update({
                where: { id: participation.eventId },
                data: {
                    bankAmount: {
                        increment: parseFloat(deposit)
                    }
                }
            });
            
            // Создаем отрицательную транзакцию для пользователя
            await prisma.transaction.create({
                data: {
                    amount: -Math.abs(parseFloat(deposit)),
                    userId: participation.userId
                }
            });
            return updatedParticipation;
        });
        // Проверяем условия окончания события по количеству участников
        await participationConditionChecker.checkPeopleConditions(participation.eventId);
        // Проверяем условия окончания события по сумме в банке
        await bankConditionChecker.checkBankConditions(participation.eventId);
        return updatedParticipation;
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
    },

    /**
     * Получение участия по ID пользователя и ID события
     * @param {number} userId - ID пользователя
     * @param {number} eventId - ID события
     * @returns {Promise<Object>} - Данные участия или null
     */
    async getParticipationByUserAndEvent(userId, eventId) {
        const participation = await prismaClient.participation.findFirst({
            where: {
                userId: parseInt(userId),
                eventId: parseInt(eventId)
            },
            include: {
                user: true,
                event: true
            }
        });
        
        if (!participation) {
            throw new Error('Participation not found');
        }
        
        return participation;
    }
};

module.exports = participationService; 