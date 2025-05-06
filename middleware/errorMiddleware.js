const apiError = require('../exceptions/apiError');

module.exports = function (err, req, res, next) {

    console.log(err);

    if (err instanceof apiError) {
        return res.status(err.status).json({message: err.message, errors: err.errors});
    }

    return res.status(500).json({message: 'Unknown server error'});
}