const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const jwt = require('jsonwebtoken');

class TokenService {

    generateTokens(payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '15d' });

        return {
            accessToken,
            refreshToken
        };
    }

    validateTokens(tokens) {

    }

    validateAccessToken(accessToken) {
        try {
            const userData = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
            return userData;
        } catch (error) {
            return null;
        }
    }

    validateRefreshToken(refreshToken) {
        try {
            const userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            return userData;
        } catch (error) {
            return null;
        }
    }

    // TODO: нужно учитывать возможность наличия нескольких токенов !!!
    async saveToken(userId, refreshToken) {
        const tokenData = await prismaClient.token.findUnique({
                where: { userId }
            }
        )
        if(tokenData) {
            return prismaClient.token.update({
                where: {userId},
                data: {refreshToken}
            });
        }

        const token = await prismaClient.token.create({
            data: {
                userId,
                refreshToken
            }
        });
        return token;
    }

    async removeToken(refreshToken) {
        const tokenData = await prismaClient.token.delete({
            where: { refreshToken }
        });
        return tokenData;
    }

    async findToken(refreshToken) {
        const tokenData = await prismaClient.token.findUnique({
            where: { refreshToken }
        });
        return tokenData;
    }
}

module.exports = new TokenService();