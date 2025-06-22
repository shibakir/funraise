const Joi = require("joi");

const createUserCriterionProgressSchema = Joi.object({
    userAchievementId: Joi.number().required(),
    criterionId: Joi.number().required(),
});

module.exports = createUserCriterionProgressSchema;
