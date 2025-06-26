const { participationService, transactionService, userService, eventService } = require('../../../service');
const { pubsub, SUBSCRIPTION_EVENTS } = require('../../pubsub');
const createParticipationSchema = require('../../../validation/schema/ParticipationSchema');
const createTransactionSchema = require('../../../validation/schema/TransactionSchema');
const { handleServiceError } = require('../../utils/errorHandler');

/**
 * GraphQL resolvers for Participation-related operations
 * Handles user participation in events, transactions, and balance management
 */
const participationResolvers = {
    Query: {
        /**
         * Retrieves a specific user's participation in an event
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Query arguments
         * @param {number} args.userId - ID of the user
         * @param {number} args.eventId - ID of the event
         * @returns {Promise<Participation|null>} User's participation in the event or null if not found
         */
        userParticipation: async (_, { userId, eventId }) => {
            try {
                return await participationService.findByUserAndEvent(userId, eventId);
            } catch (error) {
                console.error('Error fetching user participation:', error);
                return null;
            }
        },

        /**
         * Retrieves the current balance for a specific user
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Query arguments
         * @param {number} args.userId - ID of the user to get balance for
         * @returns {Promise<number>} Current user balance or 0 if user not found
         */
        userBalance: async (_, { userId }) => {
            try {
                const user = await userService.findById(userId, false);
                return user ? user.balance : 0;
            } catch (error) {
                console.error('Error fetching user balance:', error);
                return 0;
            }
        }
    },

    Mutation: {
        /**
         * Creates a new transaction record
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {Object} args.input - Transaction creation data
         * @param {number} args.input.amount - Transaction amount
         * @param {string} args.input.type - Transaction type (e.g., 'EVENT_OUTCOME')
         * @param {number} args.input.userId - ID of the user making the transaction
         * @returns {Promise<Transaction>} Created transaction object
         * @throws {Error} If transaction creation fails or validation errors occur
         */
        createTransaction: async (_, { input }) => {
            try {
                // Validate transaction input data
                const { error } = createTransactionSchema.validate(input);
                if (error) {
                    throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
                }

                const transaction = await transactionService.create(input);
                return transaction;
            } catch (error) {
                console.error('Error creating transaction:', error);
                handleServiceError(error, 'Failed to create transaction');
            }
        },

        /**
         * Creates or updates a user's participation in an event (upsert operation)
         * Handles both new participations and deposit updates for existing participations
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {Object} args.input - Participation upsert data
         * @param {number} args.input.userId - ID of the participating user
         * @param {number} args.input.eventId - ID of the event to participate in
         * @param {number} args.input.deposit - Amount to deposit or add to existing deposit
         * @returns {Promise<Object>} Result object with participation, transaction, and creation status
         * @returns {Participation} returns.participation - Created or updated participation
         * @returns {boolean} returns.isNewParticipation - Whether this was a new participation
         * @returns {Transaction} returns.transaction - Associated transaction record
         * @throws {Error} If participation creation/update fails or validation errors occur
         */
        upsertParticipation: async (_, { input }) => {
            try {
                // Validate participation input data
                const { error } = createParticipationSchema.validate(input);
                if (error) {
                    throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
                }

                const { userId, eventId, deposit } = input;
                
                // Check if user already participates in this event
                const existingParticipation = await participationService.findByUserAndEvent(userId, eventId);
                
                let participation;
                let isNewParticipation;
                let transaction;
                
                if (existingParticipation) {
                    // Update existing participation by adding to current deposit
                    const newDeposit = existingParticipation.deposit + deposit;
                    participation = await participationService.update(existingParticipation.id, {
                        deposit: newDeposit
                    });
                    
                    // Create transaction record for the additional deposit
                    transaction = await transactionService.create({
                        amount: deposit,
                        type: 'EVENT_OUTCOME',
                        userId: userId
                    });
                    
                    isNewParticipation = false;

                    // Trigger event condition checks for updated participation
                    const eventConditions = require('../../../utils/eventCondition');
                    await eventConditions.onParticipationUpdated(eventId, userId, newDeposit);

                    // Publish real-time update for participation change
                    pubsub.publish(SUBSCRIPTION_EVENTS.PARTICIPATION_UPDATED, {
                        participationUpdated: { id: existingParticipation.id, eventId }
                    });
                } else {
                    // Create new participation record
                    const newParticipation = await participationService.create({
                        userId,
                        eventId,
                        deposit
                    });
                    
                    // Create associated transaction record
                    transaction = await transactionService.create({
                        amount: deposit,
                        type: 'EVENT_OUTCOME',
                        userId: userId
                    });
                    
                    // Retrieve full participation data with associations
                    participation = await participationService.findById(newParticipation.id);
                    
                    isNewParticipation = true;

                    // Publish real-time update for new participation
                    pubsub.publish(SUBSCRIPTION_EVENTS.PARTICIPATION_CREATED, {
                        participationCreated: { id: newParticipation.id, eventId }
                    });
                }

                // Publish real-time updates for both creation and update scenarios
                // Notify subscribers of event bank amount change
                pubsub.publish(SUBSCRIPTION_EVENTS.EVENT_UPDATED, {
                    eventUpdated: { id: eventId }
                });

                // Notify subscribers of user balance change
                pubsub.publish(SUBSCRIPTION_EVENTS.BALANCE_UPDATED, {
                    balanceUpdated: { id: userId }
                });
                
                return {
                    participation,
                    isNewParticipation,
                    transaction
                };
            } catch (error) {
                console.error('Error upserting participation:', error);
                handleServiceError(error, 'Failed to upsert participation');
            }
        }
    },

    /**
     * Field resolvers for Participation type
     * These resolvers handle nested field resolution for Participation objects
     */
    Participation: {
        /**
         * Resolves the user associated with a participation
         * @param {Participation} participation - Parent Participation object
         * @returns {Promise<User|null>} User object or null if not found
         */
        user: async (participation) => {
            // Return cached user if already loaded
            if (participation.user) return participation.user;
            try {
                return await userService.findById(participation.userId, false);
            } catch (error) {
                console.error('Error fetching participation user:', error);
                return null;
            }
        },

        /**
         * Resolves the event associated with a participation
         * @param {Participation} participation - Parent Participation object
         * @returns {Promise<Event|null>} Event object or null if not found
         */
        event: async (participation) => {
            // Return cached event if already loaded
            if (participation.event) return participation.event;
            try {
                return await eventService.findById(participation.eventId, false);
            } catch (error) {
                console.error('Error fetching participation event:', error);
                return null;
            }
        }
    }
};

module.exports = participationResolvers; 