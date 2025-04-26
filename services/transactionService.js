const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

/**
 * Сервис для работы с транзакциями
 */
const transactionService = {
    /**
     * Получение всех транзакций
     * @returns {Promise<Array>} - Массив всех транзакций
     */
    async getAllTransactions() {
        return prismaClient.transaction.findMany({
            include: {
                user: true
            }
        });
    },
    
    /**
     * Получение транзакции по ID
     * @param {number} id - ID транзакции
     * @returns {Promise<Object>} - Данные транзакции
     */
    async getTransactionById(id) {
        const transaction = await prismaClient.transaction.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: true
            }
        });
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        return transaction;
    },
    
    /**
     * Создание новой транзакции
     * @param {Object} transactionData - Данные транзакции
     * @returns {Promise<Object>} - Созданная транзакция
     */
    async createTransaction(transactionData) {
        const { amount, userId, type } = transactionData;
        
        // Проверяем существование пользователя
        const user = await prismaClient.user.findUnique({ 
            where: { id: parseInt(userId) } 
        });
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Проверяем, что тип транзакции допустимый
        const validTypes = ['INCOME_BALANCE', 'OUTCOME_BALANCE', 'OUTCOME_EVENT', 'EVENT_WIN'];
        if (!type || !validTypes.includes(type)) {
            throw new Error('Invalid transaction type');
        }
        
        return prismaClient.transaction.create({
            data: {
                amount: parseFloat(amount),
                userId: parseInt(userId),
                type
            },
            include: {
                user: true
            }
        });
    },
};

module.exports = transactionService; 