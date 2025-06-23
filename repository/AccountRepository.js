const BaseRepository = require('./BaseRepository');
const { Account, User } = require('../model');

class AccountRepository extends BaseRepository {
    constructor() {
        super(Account);
    }

    async findByProviderAndAccountId(provider, providerAccountId) {
        return await this.findOne({
            where: {
                provider,
                providerAccountId
            },
            include: [{ model: User }]
        });
    }

    async findByUserAndProvider(userId, provider) {
        return await this.findOne({
            where: {
                userId,
                provider
            }
        });
    }

    async updateByProviderAndAccountId(provider, providerAccountId, updateData) {
        const result = await this.updateWhere(updateData, {
            provider,
            providerAccountId
        });

        if (result[0] === 0) {
            const ApiError = require('../exception/ApiError');
            throw ApiError.notFound('Account not found');
        }

        return await this.findByProviderAndAccountId(provider, providerAccountId);
    }

    async findByUserId(userId) {
        return await this.findAll({
            where: { userId }
        });
    }
}

module.exports = new AccountRepository(); 