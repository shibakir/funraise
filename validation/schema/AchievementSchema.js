const Joi = require("joi");

const createAchievementSchema = Joi.object({
    name: Joi.string().required(),
    //description: Joi.string().required(),
    iconUrl: Joi.string().required(),
    conditions: Joi.array().items(
        Joi.object({
            type: Joi.string().required(),
            value: Joi.number().required(),
            //description: Joi.string().required(),
        })
    ).required()
});

module.exports = createAchievementSchema;
