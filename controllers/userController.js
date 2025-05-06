const userService = require('../services/userService');
const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const apiError = require('../exceptions/apiError');


class userController {

    async getAllUsers (req, res, next) {
        try {
            const { search } = req.query;
            const users = await userService.getAllUsers({ search });
            res.status(200).json(users);
        } catch (error) {
            next(error);
        }
    };

    async getUserById (req, res, next) {
        try {
            const { userId } = req.params;
            const user = await userService.getUserById(userId);
            return res.json(user);
        } catch (error) {
            next(error);
        }
    };

    async getUserBalance (req, res, next) {
        try {
            const { userId } = req.params;
            const { id } = req.user; // from auth middleware

            if(parseInt(userId) !== parseInt(id)) {
                return next(apiError.ForbiddenError("You can't get balance of another user"));
            }
            const balance = await userService.getUserBalance(id);
            res.json(balance);
        } catch (error) {
            next(error);
        }
    };

    async updateUser (req, res, next){
        try {
            const { userId } = req.params;
            const userData = req.body;
            const { id } = req.user; // from auth middleware

            if(parseInt(userId) !== parseInt(id)) {
                return next(apiError.ForbiddenError("You can't get update info of user"));
            }

            const updatedUser = await userService.updateUser(id, userData);
            res.json(updatedUser);
        } catch (error) {
            next(error);
        }
    };

    async getUserAchievements (req, res, next) {
        try {
            const { userId } = req.params;
            const id = parseInt(userId);

            // check updates of achievements
            await userService.checkUserAchievements(id);

            const userAchievements = await userService.getUserAchievements(id);
            res.json(userAchievements);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new userController();