const { userService, participationService } = require('../../../service');
const { handleServiceError } = require('../../utils/errorHandler');

/**
 * GraphQL resolvers for User-related operations
 * Handles queries, mutations, and field resolvers for user management
 */
const userResolvers = {
    Query: {
        /**
         * Retrieves a specific user by their ID
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Query arguments
         * @param {number} args.id - User ID to fetch
         * @returns {Promise<User|null>} User object with related events or null if not found
         */
        user: async (_, { id }) => {
            try {
                return await userService.findById(id, true);
            } catch (error) {
                console.error('Error fetching user:', error);
                return null;
            }
        },

        /**
         * Retrieves all users in the system
         * @param {Object} _ - Parent object (unused)
         * @param {Object} __ - Query arguments (unused)
         * @returns {Promise<User[]>} Array of all users with their related events
         */
        users: async () => {
            try {
                return await userService.findAll(true);
            } catch (error) {
                console.error('Error fetching users:', error);
                return [];
            }
        },

        /**
         * Searches for users by username using partial matching
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Query arguments
         * @param {string} args.username - Username to search for (partial match)
         * @returns {Promise<User[]>} Array of users matching the search criteria
         */
        searchUsers: async (_, { username }) => {
            try {
                return await userService.searchByUsername(username, true);
            } catch (error) {
                console.error('Error searching users:', error);
                return [];
            }
        }
    },

    Mutation: {
        /**
         * Updates an existing user's information
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {number} args.id - ID of user to update
         * @param {Object} args.input - User update data
         * @param {string} [args.input.username] - New username
         * @param {string} [args.input.email] - New email address
         * @param {string} [args.input.currentPassword] - Current password for verification
         * @param {string} [args.input.newPassword] - New password
         * @returns {Promise<User>} Updated user object
         * @throws {Error} If update fails or validation errors occur
         */
        updateUser: async (_, { id, input }) => {
            try {
                const updatedUser = await userService.update(id, input);
                return updatedUser;
            } catch (error) {
                console.error('Error updating user:', error);
                handleServiceError(error, 'Failed to update user');
            }
        },
    },

    /**
     * Field resolvers for User type
     * These resolvers handle nested field resolution for User objects
     */
    User: {
        /**
         * Resolves all events associated with a user (both created and received)
         * @param {User} user - Parent User object
         * @returns {Promise<Event[]>} Combined array of created and received events
         */
        events: async (user) => {
            try {
                const createdEvents = await user.getCreatedEvents();
                const receivedEvents = await user.getReceivedEvents();
                return [...createdEvents, ...receivedEvents];
            } catch (error) {
                console.error('Error fetching user events:', error);
                return [];
            }
        },

        /**
         * Resolves events created by the user
         * @param {User} user - Parent User object
         * @returns {Promise<Event[]>} Array of events created by this user
         */
        createdEvents: async (user) => {
            try {
                return await user.getCreatedEvents();
            } catch (error) {
                console.error('Error fetching user created events:', error);
                return [];
            }
        },

        /**
         * Resolves events where the user is the recipient
         * @param {User} user - Parent User object
         * @returns {Promise<Event[]>} Array of events where this user is the recipient
         */
        receivedEvents: async (user) => {
            try {
                return await user.getReceivedEvents();
            } catch (error) {
                console.error('Error fetching user received events:', error);
                return [];
            }
        },

        /**
         * Resolves all participations for the user
         * @param {User} user - Parent User object
         * @returns {Promise<Participation[]>} Array of user's participations with event details
         */
        participations: async (user) => {
            try {
                return await participationService.findByUser(user.id);
            } catch (error) {
                console.error('Error fetching user participations:', error);
                return [];
            }
        },

        accounts: async (user) => {
            try {
                return await userService.findAccounts(user.id);
            } catch (error) {
                console.error('Error fetching user accounts:', error);
                return [];
            }
        }
    }
};

module.exports = userResolvers; 