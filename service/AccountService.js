const ApiError = require('../exception/ApiError');
const { AccountRepository } = require('../repository');

class AccountService {

    async findByProviderAndAccountId(provider, providerAccountId) {
        try {
            return await AccountRepository.findByProviderAndAccountId(provider, providerAccountId);
        } catch (e) {
            throw ApiError.database('Error finding account by provider and account ID', e);
        }
    }

    async findByUserAndProvider(userId, provider) {
        try {
            return await AccountRepository.findByUserAndProvider(userId, provider);
        } catch (e) {
            throw ApiError.database('Error finding account by user and provider', e);
        }
    }

    async create(accountData) {
        try {
            return await AccountRepository.create(accountData);
        } catch (e) {
            throw ApiError.database('Error creating account', e);
        }
    }

    async update(accountId, updateData) {
        try {
            const account = await AccountRepository.findByPk(accountId);
            if (!account) {
                throw ApiError.notFound('Account not found');
            }

            await AccountRepository.update(accountId, updateData);
            return await AccountRepository.findByPk(accountId);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error updating account', e);
        }
    }

    async updateByProviderAndAccountId(provider, providerAccountId, updateData) {
        try {
            return await AccountRepository.updateByProviderAndAccountId(provider, providerAccountId, updateData);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error updating account by provider and account ID', e);
        }
    }
}

module.exports = new AccountService(); 