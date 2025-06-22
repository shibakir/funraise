const Joi = require("joi");

const createUserAchievement = Joi.object({
    achievementId: Joi.number().required(),
    userId: Joi.number().required(),
});

module.exports = createUserAchievement;