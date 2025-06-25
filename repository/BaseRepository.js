const ApiError = require('../exception/ApiError');

/**
 * Base repository class providing common CRUD operations for all entities
 * This class serves as a template for all specific repository implementations
 * and handles standard database operations with consistent error handling
 */
class BaseRepository {
    /**
     * Creates a new repository instance for the specified Sequelize model
     * @param {Object} model - Sequelize model class to operate on
     */
    constructor(model) {
        this.model = model;
    }

    /**
     * Creates a new record in the database
     * @param {Object} data - Data object containing field values for the new record
     * @returns {Promise<Object>} Created model instance
     * @throws {ApiError} Database error if creation fails
     */
    async create(data) {
        try {
            return await this.model.create(data);
        } catch (error) {
            throw ApiError.database(`Error creating ${this.model.name}`, error);
        }
    }

    /**
     * Finds a record by its primary key (usually ID)
     * @param {number|string} id - Primary key value to search for
     * @param {Object} options - Sequelize query options (include, attributes, etc.)
     * @returns {Promise<Object>} Found model instance
     * @throws {ApiError} Not found error if record doesn't exist or database error
     */
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

    /**
     * Finds a single record matching the specified criteria
     * @param {Object} options - Sequelize query options (where, include, attributes, etc.)
     * @returns {Promise<Object|null>} Found model instance or null if not found
     * @throws {ApiError} Database error if query fails
     */
    async findOne(options = {}) {
        try {
            return await this.model.findOne(options);
        } catch (error) {
            throw ApiError.database(`Error finding ${this.model.name}`, error);
        }
    }

    /**
     * Finds all records matching the specified criteria
     * @param {Object} options - Sequelize query options (where, include, limit, order, etc.)
     * @returns {Promise<Array>} Array of model instances
     * @throws {ApiError} Database error if query fails
     */
    async findAll(options = {}) {
        try {
            return await this.model.findAll(options);
        } catch (error) {
            throw ApiError.database(`Error finding all ${this.model.name}`, error);
        }
    }

    /**
     * Updates a record by its primary key
     * @param {number|string} id - Primary key value of record to update
     * @param {Object} data - Data object containing fields to update
     * @param {Object} options - Sequelize update options
     * @returns {Promise<Array>} Array containing number of affected rows
     * @throws {ApiError} Not found error if record doesn't exist or database error
     */
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

    /**
     * Updates records matching the specified where clause
     * @param {Object} data - Data object containing fields to update
     * @param {Object} whereClause - Sequelize where condition object
     * @param {Object} options - Sequelize update options
     * @returns {Promise<Array>} Array containing number of affected rows
     * @throws {ApiError} Database error if update fails
     */
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

    /**
     * Deletes a record by its primary key
     * @param {number|string} id - Primary key value of record to delete
     * @param {Object} options - Sequelize destroy options
     * @returns {Promise<number>} Number of deleted records (0 or 1)
     * @throws {ApiError} Not found error if record doesn't exist or database error
     */
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

    /**
     * Deletes records matching the specified where clause
     * @param {Object} whereClause - Sequelize where condition object
     * @param {Object} options - Sequelize destroy options
     * @returns {Promise<number>} Number of deleted records
     * @throws {ApiError} Database error if deletion fails
     */
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

    /**
     * Counts records matching the specified criteria
     * @param {Object} options - Sequelize count options (where, include, etc.)
     * @returns {Promise<number>} Number of matching records
     * @throws {ApiError} Database error if count fails
     */
    async count(options = {}) {
        try {
            return await this.model.count(options);
        } catch (error) {
            throw ApiError.database(`Error counting ${this.model.name}`, error);
        }
    }

    /**
     * Checks if any records exist matching the specified criteria
     * @param {Object} whereClause - Sequelize where condition object
     * @returns {Promise<boolean>} True if at least one record exists, false otherwise
     * @throws {ApiError} Database error if existence check fails
     */
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