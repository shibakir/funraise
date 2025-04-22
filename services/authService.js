const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const bcrypt = require('bcrypt');
const jwtUtils = require('../utils/jwtUtils');

/**
 * Сервис аутентификации пользователей
 */
const authService = {
    /**
     * Аутентификация пользователя по email/username и паролю
     * @param {Object} credentials - Учетные данные пользователя
     * @param {string} credentials.email - Email пользователя (опционально)
     * @param {string} credentials.username - Имя пользователя (опционально)
     * @param {string} credentials.password - Пароль пользователя
     * @returns {Promise<{user: Object, token: string}>} - Данные пользователя и JWT токен
     */
    async authenticate(credentials) {
        const { email, username, password } = credentials;
        
        if (!password || (!email && !username)) {
            throw new Error('Password and either email or username must be provided');
        }
        
        // Поиск пользователя по email или username
        const whereCondition = email ? { email } : { username };
        const user = await prismaClient.user.findUnique({
            where: whereCondition,
        });
        
        // Если пользователь не найден
        if (!user) {
            throw new Error('User not found');
        }
        
        // Проверяем правильность пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        
        // Генерируем токен
        const token = jwtUtils.generateToken(user);
        
        return { user, token };
    }
};

module.exports = authService; 