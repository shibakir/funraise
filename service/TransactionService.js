const { Transaction, User } = require('../model');
const ApiError = require('../exception/ApiError');
const createTransactionSchema = require("../validation/schema/TransactionSchema");
const userService = require("./UserService");

class TransactionService {

    async create(data) {

        const { error } = createTransactionSchema.validate(data);
        if (error) {
            throw ApiError.badRequest(error.details[0].message);
        }

        const { amount, type, userId } = data;

        try {
            const transaction = await Transaction.create({
                amount: amount,
                type: type,
                userId: userId
            });

            await userService.updateBalance({
                amount: amount,
                type: type,
                userId: userId
            });

            const user = await User.findOne({ where: { id: userId } });

            return transaction;
        } catch (e) {
            throw ApiError.badRequest(e.message);
        }
    }
}

module.exports = new TransactionService();