const BaseRepository = require('./BaseRepository');
const { Transaction } = require('../model');

/**
 * Repository for managing financial transactions
 * Handles user transaction history, balance changes, and transaction categorization
 */
class TransactionRepository extends BaseRepository {
    /**
     * Initializes the Transaction repository with the Transaction model
     */
    constructor() {
        super(Transaction);
    }

    /**
     * Finds all transactions for a specific user ordered by creation date
     * Used for user transaction history and balance tracking
     * @param {number} userId - ID of the user
     * @returns {Promise<Transaction[]>} Array of user transactions (newest first)
     */
    async findByUserId(userId) {
        return await this.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
    }

    /**
     * Finds all transactions of a specific type across all users
     * Used for transaction analysis and system reporting
     * @param {string} type - Transaction type (e.g., 'EVENT_OUTCOME', 'REWARD', 'DEPOSIT')
     * @returns {Promise<Transaction[]>} Array of transactions of the specified type
     */
    async findByType(type) {
        return await this.findAll({
            where: { type }
        });
    }

    /**
     * Finds all transactions for a specific user filtered by transaction type
     * Used for categorized transaction history (e.g., only event-related transactions)
     * @param {number} userId - ID of the user
     * @param {string} type - Transaction type to filter by
     * @returns {Promise<Transaction[]>} Array of user transactions of the specified type
     */
    async findByUserIdAndType(userId, type) {
        return await this.findAll({
            where: { userId, type }
        });
    }
}

module.exports = new TransactionRepository(); 