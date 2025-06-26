const ApiError = require('../exception/ApiError');
const { AccountRepository } = require('../repository');

/**
 * Service layer for managing OAuth provider accounts
 * Handles operations for Discord, Google, and other external authentication providers
 * Manages account linking, token updates, and provider-specific data
 */
class AccountService {

    /**
     * Finds an account by provider name and provider account ID
     * Used to check if an external account is already linked to a user
     * @param {string} provider - OAuth provider name (e.g., 'discord', 'google')
     * @param {string} providerAccountId - Unique account ID from the provider
     * @returns {Promise<Account|null>} Account with associated User or null if not found
     * @throws {ApiError} Database error if operation fails
     */
    async findByProviderAndAccountId(provider, providerAccountId) {
        try {
            return await AccountRepository.findByProviderAndAccountId(provider, providerAccountId);
        } catch (e) {
            throw ApiError.database('Error finding account by provider and account ID', e);
        }
    }

    /**
     * Finds an account by user ID and provider name
     * Used to check if a user already has an account linked for a specific provider
     * @param {number} userId - ID of the user
     * @param {string} provider - OAuth provider name (e.g., 'discord', 'google')
     * @returns {Promise<Account|null>} Account record or null if not found
     * @throws {ApiError} Database error if operation fails
     */
    async findByUserAndProvider(userId, provider) {
        try {
            return await AccountRepository.findByUserAndProvider(userId, provider);
        } catch (e) {
            throw ApiError.database('Error finding account by user and provider', e);
        }
    }

    /**
     * Creates a new OAuth account link for a user
     * Used when linking external accounts like Discord or Google to user profiles
     * @param {Object} accountData - Account data including provider info and tokens
     * @param {string} accountData.provider - OAuth provider name
     * @param {string} accountData.providerAccountId - Provider's unique account ID
     * @param {number} accountData.userId - ID of the user to link to
     * @param {string} accountData.access_token - OAuth access token
     * @param {string} [accountData.providerUsername] - Username from provider
     * @param {string} [accountData.providerEmail] - Email from provider
     * @param {string} [accountData.providerAvatar] - Avatar URL from provider
     * @returns {Promise<Account>} Created account object
     * @throws {ApiError} Database error if creation fails
     */
    async create(accountData) {
        try {
            return await AccountRepository.create(accountData);
        } catch (e) {
            throw ApiError.database('Error creating account', e);
        }
    }

    /**
     * Updates an existing account by its ID
     * Used for general account updates and data refreshes
     * @param {number} accountId - ID of the account to update
     * @param {Object} updateData - Data to update (tokens, username, avatar, etc.)
     * @returns {Promise<Account>} Updated account object
     * @throws {ApiError} Not found if account doesn't exist or database error
     */
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

    /**
     * Updates an account by provider and provider account ID
     * Used to refresh OAuth tokens and update provider-specific data
     * More efficient than finding by ID when provider info is available
     * @param {string} provider - OAuth provider name
     * @param {string} providerAccountId - Unique account ID from the provider
     * @param {Object} updateData - Data to update (tokens, username, avatar, etc.)
     * @returns {Promise<Account>} Updated account with associated User
     * @throws {ApiError} Not found if account doesn't exist or database error
     */
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