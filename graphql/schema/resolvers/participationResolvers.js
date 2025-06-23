const { participationService, transactionService, userService, eventService } = require('../../../service');
const { pubsub, SUBSCRIPTION_EVENTS } = require('../../pubsub');
const createParticipationSchema = require('../../../validation/schema/ParticipationSchema');
const createTransactionSchema = require('../../../validation/schema/TransactionSchema');
const { handleServiceError } = require('../../utils/errorHandler');

const participationResolvers = {
    Query: {
        userParticipation: async (_, { userId, eventId }) => {
            try {
                return await participationService.findByUserAndEvent(userId, eventId);
            } catch (error) {
                console.error('Error fetching user participation:', error);
                return null;
            }
        },
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
        createTransaction: async (_, { input }) => {
            try {
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
        upsertParticipation: async (_, { input }) => {
            try {
                const { error } = createParticipationSchema.validate(input);
                if (error) {
                    throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
                }

                const { userId, eventId, deposit } = input;
                
                // Check if participation exists
                const existingParticipation = await participationService.findByUserAndEvent(userId, eventId);
                
                let participation;
                let isNewParticipation;
                let transaction;
                
                if (existingParticipation) {
                    // Participation exists - update deposit and create transaction
                    const newDeposit = existingParticipation.deposit + deposit;
                    participation = await participationService.update(existingParticipation.id, {
                        deposit: newDeposit
                    });
                    
                    // Create transaction
                    transaction = await transactionService.create({
                        amount: deposit,
                        type: 'EVENT_OUTCOME',
                        userId: userId
                    });
                    
                    isNewParticipation = false;

                    // Check event conditions when updating participation
                    const eventConditions = require('../../../utils/eventCondition');
                    await eventConditions.onParticipationUpdated(eventId, userId, newDeposit);

                    // Publish event update participation
                    pubsub.publish(SUBSCRIPTION_EVENTS.PARTICIPATION_UPDATED, {
                        participationUpdated: { id: existingParticipation.id, eventId }
                    });
                } else {
                    // Participation does not exist - create new
                    const newParticipation = await participationService.create({
                        userId,
                        eventId,
                        deposit
                    });
                    
                    // Create transaction for new participation
                    transaction = await transactionService.create({
                        amount: deposit,
                        type: 'EVENT_OUTCOME',
                        userId: userId
                    });
                    
                    participation = await participationService.findById(newParticipation.id);
                    
                    isNewParticipation = true;

                    // Publish event creation participation
                    pubsub.publish(SUBSCRIPTION_EVENTS.PARTICIPATION_CREATED, {
                        participationCreated: { id: newParticipation.id, eventId }
                    });
                }

                // Publish common events for both cases
                // Update event (change of bank)
                pubsub.publish(SUBSCRIPTION_EVENTS.EVENT_UPDATED, {
                    eventUpdated: { id: eventId }
                });

                // Update user balance
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
    Participation: {
        user: async (participation) => {
            if (participation.user) return participation.user;
            try {
                return await userService.findById(participation.userId, false);
            } catch (error) {
                console.error('Error fetching participation user:', error);
                return null;
            }
        },
        event: async (participation) => {
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