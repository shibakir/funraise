const { Account } = require('../model');
const ApiError = require('../exception/ApiError');

class AccountService {

    async findByProviderAndAccountId(provider, providerAccountId) {
        try {
            const { User } = require('../model');
            return await Account.findOne({
                where: {
                    provider: provider,
                    providerAccountId: providerAccountId
                },
                include: [{ model: User }]
            });
        } catch (e) {
            throw ApiError.database('Error finding account by provider and account ID', e);
        }
    }

    async findByUserAndProvider(userId, provider) {
        try {
            return await Account.findOne({
                where: {
                    userId: userId,
                    provider: provider
                }
            });
        } catch (e) {
            throw ApiError.database('Error finding account by user and provider', e);
        }
    }

    async create(accountData) {
        try {
            return await Account.create(accountData);
        } catch (e) {
            throw ApiError.database('Error creating account', e);
        }
    }

    async update(accountId, updateData) {
        try {
            const account = await Account.findByPk(accountId);
            if (!account) {
                throw ApiError.notFound('Account not found');
            }

            await account.update(updateData);
            return account;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error updating account', e);
        }
    }

    async updateByProviderAndAccountId(provider, providerAccountId, updateData) {
        try {
            const result = await Account.update(updateData, {
                where: {
                    provider: provider,
                    providerAccountId: providerAccountId
                }
            });

            if (result[0] === 0) {
                throw ApiError.notFound('Account not found');
            }

            return await this.findByProviderAndAccountId(provider, providerAccountId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error updating account by provider and account ID', e);
        }
    }
}

module.exports = new AccountService(); 