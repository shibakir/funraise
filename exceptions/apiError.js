
module.exports = class ApiError extends Error {
    status;
    errors;

    constructor(status, message, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    static UnauthorizedError() {
        return new ApiError(401, 'User is not unauthorized');
    }

    static ForbiddenError() {
        return new ApiError(403, 'No permission to access this content');
    }

    static BadRequestError(message, errors = []) {
        return new ApiError(400, message, errors);
    }

    static NotFoundError(message) {
        return new ApiError(404, message);
    }

    static InternalServerError(message) {
        return new ApiError(500, 'Something went wrong. Please try again later.');
    }
}