const ApiError = require('../exception/ApiError');
const { TransactionRepository } = require('../repository');
const userService = require("./UserService");

class TransactionService {

    async create(data) {
        const { amount, type, userId } = data;

        try {
            const transaction = await TransactionRepository.create({
                amount: amount,
                type: type,
                userId: userId
            });

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