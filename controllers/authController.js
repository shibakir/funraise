const authService = require('../services/authService');
const {validationResult} = require('express-validator');
const apiError = require('../exceptions/apiError');

class AuthController {

    async login (req, res, next) {
        try {
            const {email, password} = req.body;
            const userData = await authService.login(email, password);

            res.cookie('refreshToken', userData.refreshToken, {maxAge: 15*24*60*60*1000, httpOnly: true})
            return res.json(userData)

        }  catch (error) {
            next(error);
        }
    };

    async register (req, res, next) {
        try {
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                return next(apiError.BadRequestError(
                "User registration data validation error",
                        errors.array()
                    )
                );
            }
            const { email, username, password } = req.body;
            const userData = await authService.register(email, username, password);

            res.cookie('refreshToken', userData.refreshToken, {maxAge: 15*24*60*60*1000, httpOnly: true})
            return res.json(userData)

        } catch (error) {
            next(error);
        }
    };

    async logout (req, res, next) {
        try {
            const {refreshToken} = req.cookies;

            const token = await authService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json(token);
        } catch (error) {
            next(error);
        }
    }

    async activate (req, res, next) {
        try {
            const activationLink = req.params.link;
            await authService.activate(activationLink);
            res.redirect('https://www.seznam.cz');
        } catch (error) {
            next(error);
        }
    }

    async refresh (req, res, next) {
        try {
            const {refreshToken} = req.cookies;

            console.log(refreshToken);


            const userData = await authService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 15*24*60*60*1000, httpOnly: true})

            return res.json(userData)

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();

