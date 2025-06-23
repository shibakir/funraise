const BaseRepository = require('./BaseRepository');
const { Transaction } = require('../model');

class TransactionRepository extends BaseRepository {
    constructor() {
        super(Transaction);
    }

    async findByUserId(userId) {
        return await this.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
    }

    async findByType(type) {
        return await this.findAll({
            where: { type }
        });
    }

    async findByUserIdAndType(userId, type) {
        return await this.findAll({
            where: { userId, type }
        });
    }
}

module.exports = new TransactionRepository(); 