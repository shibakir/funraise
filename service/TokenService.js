const ApiError = require('../exception/ApiError');
const { TokenRepository } = require('../repository');

/**
 * Service layer for managing JWT refresh tokens and user authentication sessions
 * Handles token storage, validation, cleanup, and session management
 * Provides secure token operations with proper error handling and cleanup
 */
class TokenService {
    /**
     * Saves a refresh token to the database for a specific user
     * Automatically removes any existing tokens for the user to maintain single session
     * @param {number} userId - ID of the user
     * @param {string} refreshToken - JWT refresh token to save
     * @returns {Promise<Token>} Saved token record
     * @throws {ApiError} Database error if save operation fails
     */
    async saveToken(userId, refreshToken) {
        try {
            // Delete old user token if exists to prevent token accumulation
            await TokenRepository.deleteByUserId(userId);

            // Create new token record for the user
            const token = await TokenRepository.create({
                userId,
                refreshToken
            });

            return token;
        } catch (error) {
            throw ApiError.database('Failed to save refresh token', error);
        }
    }

    /**
     * Finds and validates a refresh token in the database
     * Used during token refresh operations to verify token validity
     * @param {string} refreshToken - JWT refresh token to find and validate
     * @returns {Promise<Token>} Found token record with user information
     * @throws {ApiError} Not found error if token doesn't exist or is invalid
     */
    async findToken(refreshToken) {
        try {
            const token = await TokenRepository.findByRefreshToken(refreshToken);
            if (!token) {
                throw ApiError.notFound('Refresh token not found');
            }
            return token;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw ApiError.database('Failed to find refresh token', error);
        }
    }

    /**
     * Removes a specific refresh token from the database
     * Used during logout to invalidate the current session
     * @param {string} refreshToken - JWT refresh token to delete
     * @returns {Promise<boolean>} True if token was successfully deleted
     * @throws {ApiError} Not found error if token doesn't exist or database error
     */
    async removeToken(refreshToken) {
        try {
            const result = await TokenRepository.deleteByRefreshToken(refreshToken);
            if (result === 0) {
                throw ApiError.notFound('Refresh token not found');
            }
            return true;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw ApiError.database('Failed to remove refresh token', error);
        }
    }

    /**
     * Removes all refresh tokens for a specific user
     * Used during account deactivation or security cleanup operations
     * @param {number} userId - ID of the user whose tokens to remove
     * @returns {Promise<boolean>} True if any tokens were deleted, false if none existed
     * @throws {ApiError} Database error if deletion operation fails
     */
    async removeUserTokens(userId) {
        try {
            const result = await TokenRepository.deleteByUserId(userId);
            return result > 0;
        } catch (error) {
            throw ApiError.database('Failed to remove user tokens', error);
        }
    }
}

module.exports = new TokenService(); 