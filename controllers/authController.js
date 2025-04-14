const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const bcrypt = require('bcrypt');
const jwtUtils = require('../utils/jwtUtils');

exports.login = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            message: 'Request body is missing'
        });
    }

    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
        return res.status(400).json({
            message: 'The "password" field and one of the "email" or "username" fields must be provided.',
        });
    }

    try {
        let user;

        // Поиск пользователя по email или username
        const whereCondition = email ? { email } : { username };
        user = await prismaClient.user.findUnique({
            where: whereCondition,
        });

        // Если пользователь не найден
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Проверяем правильность пароля
        const isPasswordValid = bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Генерируем токен
        const token = jwtUtils.generateToken(user);

        // Отправляем токен клиенту
        res.status(200).json({ token });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Authentication error.' });
    }
}; 
