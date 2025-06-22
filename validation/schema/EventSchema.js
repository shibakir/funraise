const Joi = require("joi");

const createEventSchema = Joi.object({
    name: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(15).max(1000),
    type: Joi.string().required().valid('DONATION', 'FUNDRAISING', 'JACKPOT'),
    imageFile: Joi.string().required(), // base64 string of image
    userId: Joi.number().required(),
    recipientId: Joi.number().optional(),
    eventEndConditionGroups: Joi.array().items(
        Joi.object({
            conditions: Joi.array().items(
                Joi.object({
                    name: Joi.string().required(),
                    value: Joi.string().required(),
                    operator: Joi.string().required()
                })
            ).required()
        })
    ).required()
});

module.exports = createEventSchema;