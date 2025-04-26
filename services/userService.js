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
        
        return prismaClient.user.findMany({
            where: whereCondition,
            select: {id: true, username: true, image: true}
        });
    },
    
    /**
     * Получение пользователя по ID
     * @param {number} userId - ID пользователя
     * @returns {Promise<Object>} - Данные пользователя
     */
    async getUserById(userId) {
        const user = await prismaClient.user.findUnique({
            where: { id: parseInt(userId) },
            select: {
                id: true,
                username: true,
                image: true,
                createdAt: true
            }
        });
        
        if (!user) {
            throw new Error('User not found');
        }

        // Get user Balance
        const balance = await userService.getUserBalance(userId);

        const userProfile = {
            user,
            balance,
        };

        return userProfile;
    },
    
    /**
     * Создание нового пользователя
     * @param {Object} userData - Данные пользователя
     * @returns {Promise<Object>} - Созданный пользователь
     */
    async createUser(userData) {
        const { email, username, password } = userData;
        
        const user = await prismaClient.user.create({
            data: {
                email,
                username,
                password,
            }
        });

        // Инициализируем достижения для нового пользователя
        await this.initUserAchievements(user.id);

        return user;
    },
    
    /**
     * Обновление данных пользователя
     * @param {number} id - ID пользователя
     * @param {Object} userData - Обновляемые данные
     * @returns {Promise<Object>} - Обновленный пользователь
     */
    async updateUser(id, userData) {
        const { email, username, password, image } = userData;
        
        return prismaClient.user.update({
            where: {id: parseInt(id)},
            data: {
                email,
                username,
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

    /**
     * Инициализирует достижения для нового пользователя
     * @param {number} userId - ID пользователя
     */
    async initUserAchievements(userId) {
        try {
            // Получаем все доступные достижения
            const achievements = await prismaClient.achievement.findMany({
                include: {
                    criteria: true
                }
            });

            // Для каждого достижения создаем запись UserAchievement и UserCriterionProgress
            for (const achievement of achievements) {
                // Создаем запись UserAchievement
                const userAchievement = await prismaClient.userAchievement.create({
                    data: {
                        userId: userId,
                        achievementId: achievement.id,
                        status: 'IN_PROGRESS'
                    }
                });

                // Для каждого критерия создаем запись UserCriterionProgress
                for (const criterion of achievement.criteria) {
                    await prismaClient.userCriterionProgress.create({
                        data: {
                            userAchievementId: userAchievement.id,
                            criterionId: criterion.id,
                            currentValue: 0,
                            isCompleted: false
                        }
                    });
                }
            }

            // Запускаем первичную проверку достижений
            const { checkAllAchievements } = require('../utils/achievementCheckers');
            await checkAllAchievements(userId);
            
            console.log(`Achievements initialized for user ID: ${userId}`);
        } catch (error) {
            console.error('Error initializing user achievements:', error);
        }
    },

    /**
     * Проверяет достижения пользователя
     * @param {number} userId - ID пользователя
     */
    async checkUserAchievements(userId) {
        try {
            const { checkAllAchievements } = require('../utils/achievementCheckers');
            await checkAllAchievements(userId);
        } catch (error) {
            console.error('Error checking user achievements:', error);
        }
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