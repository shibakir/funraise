const ApiError = require('../exception/ApiError');

class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        try {
            return await this.model.create(data);
        } catch (error) {
            throw ApiError.database(`Error creating ${this.model.name}`, error);
        }
    }

    async findByPk(id, options = {}) {
        try {
            const record = await this.model.findByPk(id, options);
            if (!record) {
                throw ApiError.notFound(`${this.model.name} not found`);
            }
            return record;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw ApiError.database(`Error finding ${this.model.name} by ID`, error);
        }
    }

    async findOne(options = {}) {
        try {
            return await this.model.findOne(options);
        } catch (error) {
            throw ApiError.database(`Error finding ${this.model.name}`, error);
        }
    }

    async findAll(options = {}) {
        try {
            return await this.model.findAll(options);
        } catch (error) {
            throw ApiError.database(`Error finding all ${this.model.name}`, error);
        }
    }

    async update(id, data, options = {}) {
        try {
            const result = await this.model.update(data, {
                where: { id },
                ...options
            });

            if (result[0] === 0) {
                throw ApiError.notFound(`${this.model.name} not found`);
            }

            return result;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw ApiError.database(`Error updating ${this.model.name}`, error);
        }
    }

    async updateWhere(data, whereClause, options = {}) {
        try {
            const result = await this.model.update(data, {
                where: whereClause,
                ...options
            });

            return result;
        } catch (error) {
            throw ApiError.database(`Error updating ${this.model.name}`, error);
        }
    }

    async destroy(id, options = {}) {
        try {
            const result = await this.model.destroy({
                where: { id },
                ...options
            });

            if (result === 0) {
                throw ApiError.notFound(`${this.model.name} not found`);
            }

            return result;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw ApiError.database(`Error deleting ${this.model.name}`, error);
        }
    }

    async destroyWhere(whereClause, options = {}) {
        try {
            return await this.model.destroy({
                where: whereClause,
                ...options
            });
        } catch (error) {
            throw ApiError.database(`Error deleting ${this.model.name}`, error);
        }
    }

    async count(options = {}) {
        try {
            return await this.model.count(options);
        } catch (error) {
            throw ApiError.database(`Error counting ${this.model.name}`, error);
        }
    }

    async exists(whereClause) {
        try {
            const count = await this.model.count({ where: whereClause });
            return count > 0;
        } catch (error) {
            throw ApiError.database(`Error checking if ${this.model.name} exists`, error);
        }
    }
}

module.exports = BaseRepository; 