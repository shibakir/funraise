const { Token } = require('../model');
const ApiError = require('../exception/ApiError');

class TokenService {
    /**
     * Сохраняет refresh token в базу данных
     * @param {number} userId - ID пользователя
     * @param {string} refreshToken - Refresh token для сохранения
     * @returns {Promise<Token>} Сохраненный токен
     */
    async saveToken(userId, refreshToken) {
        try {
            // Удаляем старый токен пользователя, если есть
            await Token.destroy({
                where: { userId }
            });

            // Создаем новый токен
            const token = await Token.create({
                userId,
                refreshToken
            });

            return token;
        } catch (error) {
            console.error('Error saving token:', error);
            throw ApiError.database('Failed to save refresh token', error);
        }
    }

    /**
     * Находит токен по refresh token
     * @param {string} refreshToken - Refresh token для поиска
     * @returns {Promise<Token|null>} Найденный токен или null
     */
    async findToken(refreshToken) {
        try {
            const token = await Token.findOne({
                where: { refreshToken }
            });

            return token;
        } catch (error) {
            console.error('Error finding token:', error);
            throw ApiError.database('Failed to find refresh token', error);
        }
    }

    /**
     * Удаляет токен из базы данных
     * @param {string} refreshToken - Refresh token для удаления
     * @returns {Promise<boolean>} True если токен был удален
     */
    async removeToken(refreshToken) {
        try {
            const result = await Token.destroy({
                where: { refreshToken }
            });

            return result > 0;
        } catch (error) {
            console.error('Error removing token:', error);
            throw ApiError.database('Failed to remove refresh token', error);
        }
    }

    /**
     * Удаляет все токены пользователя
     * @param {number} userId - ID пользователя
     * @returns {Promise<boolean>} True если токены были удалены
     */
    async removeUserTokens(userId) {
        try {
            const result = await Token.destroy({
                where: { userId }
            });

            return result > 0;
        } catch (error) {
            console.error('Error removing user tokens:', error);
            throw ApiError.database('Failed to remove user tokens', error);
        }
    }
}

module.exports = new TokenService(); 