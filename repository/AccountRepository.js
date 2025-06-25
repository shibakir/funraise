const BaseRepository = require('./BaseRepository');
const { Account, User } = require('../model');
const ApiError = require('../exception/ApiError');

/**
 * Repository for managing OAuth provider accounts linked to users
 * Handles operations for Discord, Google, and other external authentication providers
 */
class AccountRepository extends BaseRepository {
    /**
     * Initializes the Account repository with the Account model
     */
    constructor() {
        super(Account);
    }

    /**
     * Finds an account by provider name and provider account ID
     * Used to check if an external account is already linked to a user
     * @param {string} provider - OAuth provider name (e.g., 'discord', 'google')
     * @param {string} providerAccountId - Unique account ID from the provider
     * @returns {Promise<Account|null>} Account with associated User or null if not found
     */
    async findByProviderAndAccountId(provider, providerAccountId) {
        return await this.findOne({
            where: {
                provider,
                providerAccountId
            },
            include: [{ model: User }]
        });
    }

    /**
     * Finds an account by user ID and provider name
     * Used to check if a user already has an account linked for a specific provider
     * @param {number} userId - ID of the user
     * @param {string} provider - OAuth provider name (e.g., 'discord', 'google')
     * @returns {Promise<Account|null>} Account record or null if not found
     */
    async findByUserAndProvider(userId, provider) {
        return await this.findOne({
            where: {
                userId,
                provider
            }
        });
    }

    /**
     * Updates an account by provider and provider account ID
     * Used to refresh OAuth tokens and update provider-specific data
     * @param {string} provider - OAuth provider name
     * @param {string} providerAccountId - Unique account ID from the provider
     * @param {Object} updateData - Data to update (tokens, username, avatar, etc.)
     * @returns {Promise<Account>} Updated account with associated User
     * @throws {ApiError} Not found error if account doesn't exist
     */
    async updateByProviderAndAccountId(provider, providerAccountId, updateData) {
        const result = await this.updateWhere(updateData, {
            provider,
            providerAccountId
        });

        // Check if any records were actually updated
        if (result[0] === 0) {
            throw ApiError.notFound('Account not found');
        }

        // Return the updated account with user information
        return await this.findByProviderAndAccountId(provider, providerAccountId);
    }

    /**
     * Finds all accounts associated with a specific user
     * Used to display all linked OAuth providers for a user
     * @param {number} userId - ID of the user
     * @returns {Promise<Account[]>} Array of accounts linked to the user
     */
    async findByUserId(userId) {
        return await this.findAll({
            where: { userId }
        });
    }
}

module.exports = new AccountRepository(); 