const Joi = require("joi");

const createTransactionSchema = Joi.object({
    amount: Joi.number().required(),
    type: Joi.string().required().valid('BALANCE_INCOME', 'BALANCE_OUTCOME', 'EVENT_INCOME', 'EVENT_OUTCOME', 'GIFT'),
    userId: Joi.number().required(),
});

module.exports = createTransactionSchema;