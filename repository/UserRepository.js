const BaseRepository = require('./BaseRepository');
const { User, Account } = require('../model');
const { Op } = require('sequelize');

/**
 * Repository for managing user accounts and authentication
 * Handles user CRUD operations, authentication queries, search functionality,
 * and user-related data retrieval with various association levels
 */
class UserRepository extends BaseRepository {
    /**
     * Initializes the User repository with the User model
     */
    constructor() {
        super(User);
    }

    /**
     * Finds a user by their email address
     * Used for login authentication and duplicate email validation
     * @param {string} email - Email address to search for
     * @returns {Promise<User|null>} User record or null if not found
     */
    async findByEmail(email) {
        return await this.findOne({
            where: { email }
        });
    }

    /**
     * Finds a user by their username
     * Used for username uniqueness validation and user lookup
     * @param {string} username - Username to search for
     * @returns {Promise<User|null>} User record or null if not found
     */
    async findByUsername(username) {
        return await this.findOne({
            where: { username }
        });
    }

    /**
     * Finds a user by their activation link token
     * Used for email verification during account activation process
     * @param {string} activationLink - Unique activation token
     * @returns {Promise<User|null>} User record or null if not found
     */
    async findByActivationLink(activationLink) {
        return await this.findOne({
            where: { activationLink }
        });
    }

    /**
     * Finds a user by either email or username
     * Used for registration validation to check if email or username already exists
     * @param {string} email - Email address to search for
     * @param {string} username - Username to search for
     * @returns {Promise<User|null>} User record or null if neither email nor username exists
     */
    async findByEmailOrUsername(email, username) {
        return await this.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { username }
                ]
            }
        });
    }

    /**
     * Searches for users by partial username match
     * Used for user discovery and friend finding functionality
     * @param {string} username - Partial username to search for
     * @param {boolean} includeAssociations - Whether to include related events data
     * @returns {Promise<User[]>} Array of users matching the search criteria
     */
    async searchByUsername(username, includeAssociations = true) {
        const includeOptions = includeAssociations ? [
            { association: 'createdEvents' },
            { association: 'receivedEvents' }
        ] : [];

        return await this.findAll({
            where: {
                username: {
                    [Op.like]: `%${username}%`
                }
            },
            include: includeOptions
        });
    }

    /**
     * Finds a user by ID with optional associations
     * Used for user profile retrieval with related data
     * @param {number} userId - ID of the user to find
     * @param {boolean} includeAssociations - Whether to include events and accounts
     * @returns {Promise<User>} User with associated data
     * @throws {ApiError} Not found error if user doesn't exist
     */
    async findByIdWithAssociations(userId, includeAssociations = true) {
        const includeOptions = includeAssociations ? [
            { association: 'createdEvents' },
            { association: 'receivedEvents' },
            { model: Account }
        ] : [];

        return await this.findByPk(userId, {
            include: includeOptions
        });
    }

    /**
     * Finds a user by ID with only balance information
     * Used for quick balance checks without loading unnecessary data
     * @param {number} userId - ID of the user
     * @returns {Promise<User>} User with only ID and balance fields
     * @throws {ApiError} Not found error if user doesn't exist
     */
    async findByIdWithBalance(userId) {
        return await this.findByPk(userId, {
            attributes: ['id', 'balance']
        });
    }

    /**
     * Finds all users with optional associations
     * Used for admin user management and system overview
     * @param {boolean} includeAssociations - Whether to include events data
     * @returns {Promise<User[]>} Array of all users with associated data
     */
    async findAllWithAssociations(includeAssociations = true) {
        const includeOptions = includeAssociations ? [
            { association: 'createdEvents' },
            { association: 'receivedEvents' }
        ] : [];

        return await this.findAll({
            include: includeOptions
        });
    }

    /**
     * Finds all users with minimal data (only IDs)
     * Used for bulk operations and system statistics
     * @returns {Promise<User[]>} Array of users with only ID field
     */
    async findAllMinimal() {
        return await this.findAll({
            attributes: ['id']
        });
    }

    /**
     * Updates a user's balance to a new value
     * Used for transaction processing and balance adjustments
     * @param {number} userId - ID of the user
     * @param {number} newBalance - New balance amount
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if user doesn't exist or database error
     */
    async updateBalance(userId, newBalance) {
        return await this.update(userId, { balance: newBalance });
    }

    /**
     * Activates a user account and removes activation link
     * Used during email verification process
     * @param {number} userId - ID of the user to activate
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if user doesn't exist or database error
     */
    async activate(userId) {
        return await this.update(userId, {
            isActivated: true,
            activationLink: null
        });
    }

    /**
     * Updates a user's activation link token
     * Used when generating new activation emails
     * @param {number} userId - ID of the user
     * @param {string} activationLink - New activation token
     * @returns {Promise<Array>} Update result array
     * @throws {ApiError} Not found error if user doesn't exist or database error
     */
    async updateActivationLink(userId, activationLink) {
        return await this.update(userId, { activationLink });
    }

    /**
     * Finds users ranked by their current balance in descending order
     * Used for balance leaderboard functionality
     * @param {number} [limit] - Maximum number of users to return
     * @returns {Promise<Array>} Array of objects with {id, username, amount} where amount is balance
     */
    async findUsersByBalance(limit) {
        const options = {
            attributes: ['id', 'username', 'balance'],
            order: [['balance', 'DESC']],
            raw: true
        };

        if (limit && limit > 0) {
            options.limit = limit;
        }

        const users = await this.findAll(options);
        
        // Transform to match UserRanking type
        return users.map(user => ({
            id: user.id,
            username: user.username,
            amount: user.balance
        }));
    }

    /**
     * Finds users ranked by their transaction sum of specific type after specified date
     * Used for income/outcome leaderboard functionality
     * @param {string} transactionType - Type of transaction (EVENT_INCOME or EVENT_OUTCOME)
     * @param {Date} [afterDate] - Date to filter transactions after (not older than)
     * @param {number} [limit] - Maximum number of users to return
     * @returns {Promise<Array>} Array of objects with {id, username, amount} where amount is transaction sum
     */
    async findUsersByTransactionSum(transactionType, afterDate = null, limit) {
        const { Transaction } = require('../model');
        const { sequelize } = require('../model/db');

        // Build date filter conditions
        const whereConditions = {
            type: transactionType
        };
        
        if (afterDate) {
            whereConditions.createdAt = {
                [Op.gte]: afterDate
            };
        }

        const options = {
            attributes: [
                'id',
                'username',
                [
                    sequelize.fn('COALESCE', 
                        sequelize.fn('SUM', sequelize.col('Transactions.amount')), 
                        0
                    ), 
                    'transactionSum'
                ]
            ],
            include: [{
                model: Transaction,
                as: 'Transactions',
                attributes: [],
                where: whereConditions,
                required: false // LEFT JOIN to include users with 0 transactions
            }],
            group: ['User.id', 'User.username'],
            order: [[sequelize.literal('transactionSum'), 'DESC']],
            subQuery: false
        };

        if (limit && limit > 0) {
            options.limit = limit;
        }

        const users = await this.model.findAll(options);
        
        // Transform to match UserRanking type with proper amount parsing
        return users.map(user => ({
            id: user.id,
            username: user.username,
            amount: parseFloat(user.get('transactionSum')) || 0
        }));
    }
}

module.exports = new UserRepository(); 
