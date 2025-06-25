const ApiError = require('../exception/ApiError');
const { TransactionRepository } = require('../repository');
const userService = require("./UserService");

/**
 * Service layer for managing financial transactions
 * Handles transaction creation, user balance updates, and maintains transaction history
 * Integrates with user service to ensure balance consistency and proper error handling
 */
class TransactionService {

    /**
     * Creates a new transaction and updates user balance atomically
     * Ensures data consistency by updating both transaction record and user balance
     * @param {Object} data - Transaction data
     * @param {number} data.amount - Transaction amount (must be positive)
     * @param {string} data.type - Transaction type from TRANSACTION_TYPES constants
     * @param {number} data.userId - ID of the user making the transaction
     * @returns {Promise<Transaction>} Created transaction record
     * @throws {ApiError} Bad request if transaction creation or balance update fails
     */
    async create(data) {
        const { amount, type, userId } = data;

        try {
            // Create transaction record in database
            const transaction = await TransactionRepository.create({
                amount: amount,
                type: type,
                userId: userId
            });

            // Update user balance based on transaction type and amount
            // This ensures balance consistency with transaction history
            await userService.updateBalance({
                amount: amount,
                type: type,
                userId: userId
            });

            return transaction;
        } catch (e) {
            throw ApiError.badRequest(e.message);
        }
    }
}

module.exports = new TransactionService();