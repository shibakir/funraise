const apiError = require('../exceptions/apiError');
const tokenService = require('../services/tokenService');

module.exports = function authenticateToken (req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader) {
            return  next(apiError.UnauthorizedError("Unauthorized"));
        }

        const accessToken = authHeader.split(' ')[1];

        if(!accessToken) {
            return  next(apiError.UnauthorizedError("Unauthorized"));
        }

        const userData = tokenService.validateAccessToken(accessToken);
        if(!userData) {
            return  next(apiError.UnauthorizedError("Unauthorized"));
        }

        req.user = userData;
        next();
    } catch (error) {
        next(apiError.UnauthorizedError("Unauthorized"));
    }
};
