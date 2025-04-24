const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

/**
 * Сервис для работы с пользователями
 */
const userService = {
    /**
     * Получение списка всех пользователей с возможностью поиска
     * @param {Object} options - Опции поиска
     * @param {string} options.search - Строка поиска (по имени пользователя)
     * @returns {Promise<Array>} - Массив пользователей
     */
    async getAllUsers(options = {}) {
        const { search } = options;
        
        let whereCondition = {};
        if (search) {
            whereCondition = {
                username: { contains: search }
            };
        }
        
        return await prismaClient.user.findMany({
            where: whereCondition,
            select: { id: true, username: true, image: true }
        });
    },
    
    /**
     * Получение пользователя по ID
     * @param {number} id - ID пользователя
     * @returns {Promise<Object>} - Данные пользователя
     */
    async getUserById(id) {
        const user = await prismaClient.user.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
    },
    
    /**
     * Создание нового пользователя
     * @param {Object} userData - Данные пользователя
     * @returns {Promise<Object>} - Созданный пользователь
     */
    async createUser(userData) {
        const { email, name, password, image } = userData;
        
        return await prismaClient.user.create({
            data: {
                email,
                name,
                password,
                image
            }
        });
    },
    
    /**
     * Обновление данных пользователя
     * @param {number} id - ID пользователя
     * @param {Object} userData - Обновляемые данные
     * @returns {Promise<Object>} - Обновленный пользователь
     */
    async updateUser(id, userData) {
        const { email, name, password, image } = userData;
        
        return prismaClient.user.update({
            where: {id: parseInt(id)},
            data: {
                email,
                name,
                password,
                image
            }
        });
    },
    
    /**
     * Удаление пользователя
     * @param {number} id - ID пользователя
     * @returns {Promise<void>}
     */
    async deleteUser(id) {
        await prismaClient.user.delete({
            where: { id: parseInt(id) }
        });
    },

    /**
     * Проверка баланса пользователя
     * @param {number} userId - ID пользователя
     * @param {number} amount - Сумма для проверки
     * @returns {Promise<boolean>} - Результат проверки
     */
    async checkUserBalance(userId, amount) {
        // Получаем все транзакции пользователя
        const transactions = await prismaClient.transaction.findMany({
            where: { userId: parseInt(userId) }
        });
        
        // Считаем текущий баланс
        const currentBalance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        
        // Проверяем, достаточно ли средств
        return currentBalance >= parseFloat(amount);
    },

    async getUserBalance(userId) {
        const transactions = await prismaClient.transaction.findMany({
            where: { userId: parseInt(userId) }
        });
        const currentBalance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        return currentBalance;
    }
};

module.exports = userService; 