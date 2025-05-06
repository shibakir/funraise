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

}

module.exports = new TokenService();