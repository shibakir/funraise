const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const userService = require('./userService');
const mailService = require('../utils/auth/mailService');
const tokenService = require('./tokenService');
const apiError = require('../exceptions/apiError');

class authService {

    async register(email, username, password) {

        const existingUserByEmail = await prismaClient.user.findUnique({
            where: { email }
        });
         const existingUserByUsername = await prismaClient.user.findUnique({
            where: { username }
        });

        if (existingUserByEmail || existingUserByUsername) {
            throw apiError.BadRequestError('This username or email is already in use');
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
            throw apiError.BadRequestError('Bad activation link');
        }

        await prismaClient.user.update({
            where: { id: user.id },
            data: { isActivated: true }
        });
    }

    async login(email, password) {

        const user = await prismaClient.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw apiError.BadRequestError('User with this email was not found');
        }

        const isPasswordEquals = await bcrypt.compare(password, user.password);
        
        if (!isPasswordEquals) {
            throw apiError.BadRequestError('Invalid password');
        }

        const { password: _, ...userWithoutPassword } = user; // dto
        const tokens = tokenService.generateTokens({...userWithoutPassword});
        await tokenService.saveToken(userWithoutPassword.id, tokens.refreshToken);

        return { ...tokens, user: userWithoutPassword};
    }

    async logout(refreshToken) {

        if(!refreshToken) {
            return null;
            //throw apiError.BadRequestError("Refresh token not provided for logout operation");
        }

        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if(!refreshToken) {
            throw apiError.UnauthorizedError('Refresh token is not provided');
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);

        if(!userData || !tokenFromDb) {
            throw apiError.UnauthorizedError('Invalid refresh token');
        }

        const user = await prismaClient.user.findUnique({
            where: { id: userData.id },
        });

        const { password: _, ...userWithoutPassword } = user; // dto
        const tokens = tokenService.generateTokens({...userWithoutPassword});
        await tokenService.saveToken(userWithoutPassword.id, tokens.refreshToken);

        return { ...tokens, user: userWithoutPassword};
    }
}

module.exports = new authService();