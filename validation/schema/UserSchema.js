const Joi = require("joi");

const createUserSchema = Joi.object({

    email: Joi.string().email().required(),
    username: Joi.string().min(5).max(30).required(),
    password: Joi.string().min(5).max(100).required(),
    image: Joi.string().uri().optional(),
});

module.exports = createUserSchema;