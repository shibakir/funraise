const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const bcrypt = require('bcrypt');
const jwtUtils = require('../utils/jwtUtils');
const userService = require('./userService');

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
            console.error("User not found: ", email || username, "")
            throw new Error('User not found');
        }
        
        // Проверяем правильность пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.error("Invalid password: ", password, "")
            throw new Error('Invalid password');
        }
        
        // Генерируем токен
        const token = jwtUtils.generateToken(user);
        
        return { user, token };
    },

    /**
     * Регистрация нового пользователя
     * @param {Object} userData - Данные пользователя
     * @param {string} userData.email - Email пользователя
     * @param {string} userData.username - Имя пользователя
     * @param {string} userData.password - Пароль пользователя
     * @returns {Promise<{user: Object, token: string}>} - Данные пользователя и JWT токен
     */
    async register(userData) {
        const { email, username, password } = userData;
        
        if (!email || !password || !username) {
            throw new Error('Email, username and password are required');
        }
        
        // Проверяем, не существует ли уже пользователь с таким email или username
        const existingUserByEmail = await prismaClient.user.findUnique({
            where: { email }
        });
        
        if (existingUserByEmail) {
            throw new Error('Email already in use');
        }
        
        const existingUserByUsername = await prismaClient.user.findUnique({
            where: { username }
        });
        
        if (existingUserByUsername) {
            throw new Error('Username already in use');
        }
        
        // Хешируем пароль
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Создаем пользователя
        const user = await userService.createUser({
            email,
            username,
            password: hashedPassword
        });
        
        // Генерируем токен
        const token = jwtUtils.generateToken(user);
        
        return { user, token };
    }
};

module.exports = authService; 