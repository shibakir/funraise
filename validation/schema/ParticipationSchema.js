const Joi = require("joi");

const createParticipationSchema = Joi.object({
    deposit: Joi.number().required(),
    userId: Joi.number().required(),
    eventId: Joi.number().required()
});

module.exports = createParticipationSchema;