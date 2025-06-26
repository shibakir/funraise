const BaseRepository = require('./BaseRepository');
const { Token } = require('../model');

/**
 * Repository for managing JWT refresh tokens
 * Handles token storage, retrieval, and cleanup for user authentication sessions
 */
class TokenRepository extends BaseRepository {
    /**
     * Initializes the Token repository with the Token model
     */
    constructor() {
        super(Token);
    }

    /**
     * Finds a token record by refresh token value
     * Used for token validation during refresh token authentication
     * @param {string} refreshToken - The refresh token to search for
     * @returns {Promise<Token|null>} Token record or null if not found
     */
    async findByRefreshToken(refreshToken) {
        return await this.findOne({
            where: { refreshToken }
        });
    }

    /**
     * Finds the current token record for a specific user
     * Used to check if user has an active refresh token
     * @param {number} userId - ID of the user
     * @returns {Promise<Token|null>} User's token record or null if not found
     */
    async findByUserId(userId) {
        return await this.findOne({
            where: { userId }
        });
    }

    /**
     * Deletes all token records for a specific user
     * Used during logout to invalidate all user sessions
     * @param {number} userId - ID of the user
     * @returns {Promise<number>} Number of deleted token records
     * @throws {ApiError} Database error if deletion fails
     */
    async deleteByUserId(userId) {
        return await this.destroyWhere({ userId });
    }

    /**
     * Deletes a specific refresh token
     * Used during logout or token revocation to invalidate a specific session
     * @param {string} refreshToken - The refresh token to delete
     * @returns {Promise<number>} Number of deleted token records
     * @throws {ApiError} Database error if deletion fails
     */
    async deleteByRefreshToken(refreshToken) {
        return await this.destroyWhere({ refreshToken });
    }
}

module.exports = new TokenRepository(); 