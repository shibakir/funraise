const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const jwtUtils = require('../utils/jwtUtils');
const userService = require('./userService');
const mailService = require('../utils/auth/mailService');
const tokenService = require('./tokenService');

class authService {

    async register(email, username, password) {

        const existingUserByEmail = await prismaClient.user.findUnique({
            where: { email }
        });
        const existingUserByUsername = await prismaClient.user.findUnique({
            where: { username }
        });

        if (existingUserByEmail || existingUserByUsername) {
            throw new Error('This username or email is already in use');
        }

        // use hash
        const hashedPassword = await bcrypt.hash(password, 10);

        const activationLink = uuid.v4();

        const user = await userService.createUser({
            email,
            username,
            password: hashedPassword,
            activationLink
        });
        const { password: _, ...userWithoutPassword } = user; // dto

        await mailService.sendActivationMail(email, `${process.env.API_URL}/activate/${activationLink}`);

        //const token = jwtUtils.generateToken(user); // old style
        const tokens = tokenService.generateTokens(userWithoutPassword);
        await tokenService.saveToken(userWithoutPassword.id, tokens.refreshToken);

        return { ...tokens, user: userWithoutPassword};
    }

    async activate(activationLink) {
        const user = await prismaClient.user.findUnique({
            where: { activationLink }
        })
        if(!user) {
            throw new Error('Bad activation link');
        }

        await prismaClient.user.update({
            where: { id: user.id },
            data: { isActivated: true }
        });
    }


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
    }

}

module.exports = new authService();