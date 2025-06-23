const ApiError = require('../exception/ApiError');
const { TokenRepository } = require('../repository');

class TokenService {
    /**
     * Saves refresh token to the database
     * @param {number} userId - User ID
     * @param {string} refreshToken - Refresh token to save
     * @returns {Promise<Token>} Saved token
     */
    async saveToken(userId, refreshToken) {
        try {
            // Delete old user token if exists
            await TokenRepository.deleteByUserId(userId);

            // Create new token
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
     * Finds token by refresh token
     * @param {string} refreshToken - Refresh token to find
     * @returns {Promise<Token|null>} Found token or throws notFound
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
     * Deletes token from the database
     * @param {string} refreshToken - Refresh token to delete
     * @returns {Promise<boolean>} True if token was deleted, throws notFound если не найден
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
     * Deletes all user tokens
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} True if tokens were deleted
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