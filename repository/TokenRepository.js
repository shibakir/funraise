const BaseRepository = require('./BaseRepository');
const { Token } = require('../model');

class TokenRepository extends BaseRepository {
    constructor() {
        super(Token);
    }

    async findByRefreshToken(refreshToken) {
        return await this.findOne({
            where: { refreshToken }
        });
    }

    async findByUserId(userId) {
        return await this.findOne({
            where: { userId }
        });
    }

    async deleteByUserId(userId) {
        return await this.destroyWhere({ userId });
    }

    async deleteByRefreshToken(refreshToken) {
        return await this.destroyWhere({ refreshToken });
    }
}

module.exports = new TokenRepository(); 