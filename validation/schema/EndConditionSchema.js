const Joi = require("joi");

const createEndConditionSchema = Joi.object({
    name: Joi.string().required(),
    operator: Joi.string().required().valid('EQUALS', 'GREATER', 'LESS', 'GREATER_EQUALS', 'LESS_EQUALS'),
    value: Joi.string().required(),
    endConditionId:  Joi.number().required()
});

module.exports = createEndConditionSchema;