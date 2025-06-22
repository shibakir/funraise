const Joi = require("joi");

const createAchievementCriterionSchema = Joi.object({
    type: Joi.string().required(),
    value: Joi.number().required(),
});

module.exports = createAchievementCriterionSchema;
