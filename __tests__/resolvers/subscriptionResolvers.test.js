const { pubsub, SUBSCRIPTION_EVENTS } = require('../../graphql/pubsub');
const { eventService, userService, participationService, eventEndConditionService } = require('../../service');

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

describe('subscriptionResolvers', () => {
    // Import subscriptionResolvers after setting up mocks
    let subscriptionResolvers;
    
    beforeAll(() => {
        subscriptionResolvers = require('../../graphql/schema/resolvers/subscriptionResolvers');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Subscription structure', () => {
        it('should have all required subscription resolvers', () => {
            expect(subscriptionResolvers.Subscription).toBeDefined();
            expect(subscriptionResolvers.Subscription.eventUpdated).toBeDefined();
            expect(subscriptionResolvers.Subscription.participationCreated).toBeDefined();
            expect(subscriptionResolvers.Subscription.participationUpdated).toBeDefined();
            expect(subscriptionResolvers.Subscription.balanceUpdated).toBeDefined();
            expect(subscriptionResolvers.Subscription.eventConditionsUpdated).toBeDefined();
        });

        it('should have resolve and subscribe properties for each subscription', () => {
            const subscriptions = [
                'eventUpdated',
                'participationCreated', 
                'participationUpdated',
                'balanceUpdated',
                'eventConditionsUpdated'
            ];

            subscriptions.forEach(subscription => {
                expect(subscriptionResolvers.Subscription[subscription]).toHaveProperty('subscribe');
                expect(subscriptionResolvers.Subscription[subscription]).toHaveProperty('resolve');
                expect(typeof subscriptionResolvers.Subscription[subscription].resolve).toBe('function');
            });
        });
    });

    describe('Filter function behavior integration tests', () => {
        // Instead of testing the filter functions directly, we test the behavior
        // by checking that the subscribe property exists and is configured correctly
        
                 it('should have subscribe functions for all subscription types', () => {
             const subscriptions = [
                 'eventUpdated',
                 'participationCreated', 
                 'participationUpdated',
                 'balanceUpdated',
                 'eventConditionsUpdated'
             ];

             subscriptions.forEach(subscription => {
                 expect(subscriptionResolvers.Subscription[subscription].subscribe).toBeDefined();
                 expect(typeof subscriptionResolvers.Subscription[subscription].subscribe).toBe('function');
             });
         });

        it('should verify subscription events are configured correctly', () => {
            // Test that subscription functions exist and are properly configured
            // The pubsub.asyncIterator calls happen during module loading, so we can't easily test them
            // Instead, we verify the structure is correct
            expect(SUBSCRIPTION_EVENTS.EVENT_UPDATED).toBeDefined();
            expect(SUBSCRIPTION_EVENTS.PARTICIPATION_CREATED).toBeDefined();
            expect(SUBSCRIPTION_EVENTS.PARTICIPATION_UPDATED).toBeDefined();
            expect(SUBSCRIPTION_EVENTS.BALANCE_UPDATED).toBeDefined();
            expect(SUBSCRIPTION_EVENTS.EVENT_CONDITIONS_UPDATED).toBeDefined();
        });
    });

    describe('Subscription.eventUpdated', () => {
        it('should successfully resolve with updated event', async () => {
            const mockEvent = {
                id: 1,
                name: 'Updated Event',
                description: 'Updated Description',
                status: 'IN_PROGRESS',
                bankAmount: 1000
            };

            eventService.findById.mockResolvedValue(mockEvent);

            const payload = { eventUpdated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.eventUpdated.resolve(payload);

            expect(eventService.findById).toHaveBeenCalledWith(1, true);
            expect(result).toEqual(mockEvent);
        });

        it('should return null if event service fails', async () => {
            eventService.findById.mockRejectedValue(new Error('Database connection failed'));

            const payload = { eventUpdated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.eventUpdated.resolve(payload);

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching event for subscription:', 
                expect.any(Error)
            );
        });

        it('should return null if event is not found', async () => {
            eventService.findById.mockResolvedValue(null);

            const payload = { eventUpdated: { id: 999 } };
            const result = await subscriptionResolvers.Subscription.eventUpdated.resolve(payload);

            expect(result).toBeNull();
        });

        it('should handle payload without eventId', async () => {
            eventService.findById.mockResolvedValue(null);

            const payload = { eventUpdated: {} };
            const result = await subscriptionResolvers.Subscription.eventUpdated.resolve(payload);

            expect(eventService.findById).toHaveBeenCalledWith(undefined, true);
            expect(result).toBeNull();
        });

        it('should handle malformed payload', async () => {
            eventService.findById.mockResolvedValue(null);

            const payload = {};
            const result = await subscriptionResolvers.Subscription.eventUpdated.resolve(payload);

            expect(result).toBeNull();
        });
    });

    describe('Subscription.participationCreated', () => {
        it('should successfully resolve with created participation', async () => {
            const mockParticipation = {
                id: 1,
                userId: 1,
                eventId: 1,
                deposit: 100,
                user: { id: 1, username: 'testuser' },
                event: { id: 1, name: 'Test Event' }
            };

            participationService.findById.mockResolvedValue(mockParticipation);

            const payload = { participationCreated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.participationCreated.resolve(payload);

            expect(participationService.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockParticipation);
        });

        it('should return null if participation service fails', async () => {
            participationService.findById.mockRejectedValue(new Error('Service unavailable'));

            const payload = { participationCreated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.participationCreated.resolve(payload);

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching participation for subscription:', 
                expect.any(Error)
            );
        });

        it('should return null if participation is not found', async () => {
            participationService.findById.mockResolvedValue(null);

            const payload = { participationCreated: { id: 999 } };
            const result = await subscriptionResolvers.Subscription.participationCreated.resolve(payload);

            expect(result).toBeNull();
        });

        it('should handle payload without participationId', async () => {
            participationService.findById.mockResolvedValue(null);

            const payload = { participationCreated: {} };
            const result = await subscriptionResolvers.Subscription.participationCreated.resolve(payload);

            expect(participationService.findById).toHaveBeenCalledWith(undefined);
            expect(result).toBeNull();
        });
    });

    describe('Subscription.participationUpdated', () => {
        it('should successfully resolve with updated participation', async () => {
            const mockParticipation = {
                id: 1,
                userId: 1,
                eventId: 1,
                deposit: 200,
                updatedAt: new Date(),
                user: { id: 1, username: 'testuser' },
                event: { id: 1, name: 'Test Event' }
            };

            participationService.findById.mockResolvedValue(mockParticipation);

            const payload = { participationUpdated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.participationUpdated.resolve(payload);

            expect(participationService.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockParticipation);
        });

        it('should return null if participation service fails', async () => {
            participationService.findById.mockRejectedValue(new Error('Database timeout'));

            const payload = { participationUpdated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.participationUpdated.resolve(payload);

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching participation for subscription:', 
                expect.any(Error)
            );
        });

        it('should handle multiple concurrent updates', async () => {
            const mockParticipation1 = { 
                id: 1, 
                deposit: 100,
                userId: 1,
                eventId: 1
            };
            const mockParticipation2 = { 
                id: 2, 
                deposit: 200,
                userId: 2,
                eventId: 1
            };

            participationService.findById
                .mockResolvedValueOnce(mockParticipation1)
                .mockResolvedValueOnce(mockParticipation2);

            const payload1 = { participationUpdated: { id: 1 } };
            const payload2 = { participationUpdated: { id: 2 } };

            const [result1, result2] = await Promise.all([
                subscriptionResolvers.Subscription.participationUpdated.resolve(payload1),
                subscriptionResolvers.Subscription.participationUpdated.resolve(payload2)
            ]);

            expect(result1).toEqual(mockParticipation1);
            expect(result2).toEqual(mockParticipation2);
        });

        it('should return null if participation is not found', async () => {
            participationService.findById.mockResolvedValue(null);

            const payload = { participationUpdated: { id: 999 } };
            const result = await subscriptionResolvers.Subscription.participationUpdated.resolve(payload);

            expect(result).toBeNull();
        });
    });

    describe('Subscription.balanceUpdated', () => {
        it('should successfully resolve with updated user balance', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                balance: 1500,
                createdEvents: [],
                receivedEvents: [],
                isActivated: true
            };

            userService.findById.mockResolvedValue(mockUser);

            const payload = { balanceUpdated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.balanceUpdated.resolve(payload);

            expect(userService.findById).toHaveBeenCalledWith(1, true);
            expect(result).toEqual(mockUser);
        });

        it('should return null if user service fails', async () => {
            userService.findById.mockRejectedValue(new Error('User not found'));

            const payload = { balanceUpdated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.balanceUpdated.resolve(payload);

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching user for subscription:', 
                expect.any(Error)
            );
        });

        it('should return null if user is not found', async () => {
            userService.findById.mockResolvedValue(null);

            const payload = { balanceUpdated: { id: 999 } };
            const result = await subscriptionResolvers.Subscription.balanceUpdated.resolve(payload);

            expect(result).toBeNull();
        });

        it('should handle zero balance correctly', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                balance: 0,
                isActivated: true
            };

            userService.findById.mockResolvedValue(mockUser);

            const payload = { balanceUpdated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.balanceUpdated.resolve(payload);

            expect(result.balance).toBe(0);
            expect(result).toEqual(mockUser);
        });

        it('should handle negative balance correctly', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                balance: -50
            };

            userService.findById.mockResolvedValue(mockUser);

            const payload = { balanceUpdated: { id: 1 } };
            const result = await subscriptionResolvers.Subscription.balanceUpdated.resolve(payload);

            expect(result.balance).toBe(-50);
        });

        it('should handle payload without userId', async () => {
            userService.findById.mockResolvedValue(null);

            const payload = { balanceUpdated: {} };
            const result = await subscriptionResolvers.Subscription.balanceUpdated.resolve(payload);

            expect(userService.findById).toHaveBeenCalledWith(undefined, true);
            expect(result).toBeNull();
        });
    });

    describe('Subscription.eventConditionsUpdated', () => {
        it('should successfully resolve with updated event conditions', async () => {
            const mockEventConditions = [
                { 
                    id: 1, 
                    eventId: 1, 
                    isCompleted: false,
                    isFailed: false,
                    conditions: [
                        { id: 1, name: 'TIME', value: '2024-12-31', operator: 'LESS' }
                    ]
                },
                { 
                    id: 2, 
                    eventId: 1, 
                    isCompleted: true,
                    isFailed: false,
                    conditions: [
                        { id: 2, name: 'BANK', value: '1000', operator: 'GREATER_EQUALS' }
                    ]
                }
            ];

            eventEndConditionService.findByEventId.mockResolvedValue(mockEventConditions);

            const payload = { eventConditionsUpdated: { eventId: 1 } };
            const result = await subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(payload);

            expect(eventEndConditionService.findByEventId).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockEventConditions);
        });

        it('should return empty array if event conditions service fails', async () => {
            eventEndConditionService.findByEventId.mockRejectedValue(new Error('Conditions service error'));

            const payload = { eventConditionsUpdated: { eventId: 1 } };
            const result = await subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(payload);

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching event conditions for subscription:', 
                expect.any(Error)
            );
        });

        it('should return empty array if no conditions found', async () => {
            eventEndConditionService.findByEventId.mockResolvedValue([]);

            const payload = { eventConditionsUpdated: { eventId: 1 } };
            const result = await subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(payload);

            expect(result).toEqual([]);
        });

        it('should handle null return from service', async () => {
            eventEndConditionService.findByEventId.mockResolvedValue(null);

            const payload = { eventConditionsUpdated: { eventId: 1 } };
            const result = await subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(payload);

            expect(result).toBeNull();
        });

        it('should handle payload without eventId', async () => {
            eventEndConditionService.findByEventId.mockResolvedValue([]);

            const payload = { eventConditionsUpdated: {} };
            const result = await subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(payload);

            expect(eventEndConditionService.findByEventId).toHaveBeenCalledWith(undefined);
            expect(result).toEqual([]);
        });

        it('should handle single condition update', async () => {
            const mockCondition = [
                { 
                    id: 1, 
                    eventId: 1, 
                    isCompleted: true,
                    conditions: [
                        { id: 1, name: 'PARTICIPATION', value: '10', operator: 'EQUALS' }
                    ]
                }
            ];

            eventEndConditionService.findByEventId.mockResolvedValue(mockCondition);

            const payload = { eventConditionsUpdated: { eventId: 1 } };
            const result = await subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(payload);

            expect(result).toEqual(mockCondition);
        });
    });

    describe('Error handling and edge cases', () => {
        it('should handle all subscription resolvers gracefully on service failures', async () => {
            const error = new Error('Service unavailable');
            
            eventService.findById.mockRejectedValue(error);
            userService.findById.mockRejectedValue(error);
            participationService.findById.mockRejectedValue(error);
            eventEndConditionService.findByEventId.mockRejectedValue(error);

            const eventPayload = { eventUpdated: { id: 1 } };
            const userPayload = { balanceUpdated: { id: 1 } };
            const participationPayload = { participationCreated: { id: 1 } };
            const conditionsPayload = { eventConditionsUpdated: { eventId: 1 } };

            const results = await Promise.all([
                subscriptionResolvers.Subscription.eventUpdated.resolve(eventPayload),
                subscriptionResolvers.Subscription.balanceUpdated.resolve(userPayload),
                subscriptionResolvers.Subscription.participationCreated.resolve(participationPayload),
                subscriptionResolvers.Subscription.participationUpdated.resolve(participationPayload),
                subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(conditionsPayload)
            ]);

            expect(results[0]).toBeNull(); // eventUpdated
            expect(results[1]).toBeNull(); // balanceUpdated  
            expect(results[2]).toBeNull(); // participationCreated
            expect(results[3]).toBeNull(); // participationUpdated
            expect(results[4]).toEqual([]); // eventConditionsUpdated returns empty array
            
            expect(console.error).toHaveBeenCalledTimes(5);
        });

        it('should handle undefined payloads gracefully', async () => {
            eventService.findById.mockResolvedValue(null);
            userService.findById.mockResolvedValue(null);
            participationService.findById.mockResolvedValue(null);
            eventEndConditionService.findByEventId.mockResolvedValue([]);

            const results = await Promise.all([
                subscriptionResolvers.Subscription.eventUpdated.resolve(undefined),
                subscriptionResolvers.Subscription.balanceUpdated.resolve(undefined),
                subscriptionResolvers.Subscription.participationCreated.resolve(undefined),
                subscriptionResolvers.Subscription.participationUpdated.resolve(undefined),
                subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(undefined)
            ]);

            expect(results[0]).toBeNull();
            expect(results[1]).toBeNull();
            expect(results[2]).toBeNull();
            expect(results[3]).toBeNull();
            expect(results[4]).toEqual([]);
        });

        it('should handle null payloads gracefully', async () => {
            eventService.findById.mockResolvedValue(null);
            userService.findById.mockResolvedValue(null);
            participationService.findById.mockResolvedValue(null);
            eventEndConditionService.findByEventId.mockResolvedValue([]);

            const results = await Promise.all([
                subscriptionResolvers.Subscription.eventUpdated.resolve(null),
                subscriptionResolvers.Subscription.balanceUpdated.resolve(null),
                subscriptionResolvers.Subscription.participationCreated.resolve(null),
                subscriptionResolvers.Subscription.participationUpdated.resolve(null),
                subscriptionResolvers.Subscription.eventConditionsUpdated.resolve(null)
            ]);

            expect(results[0]).toBeNull();
            expect(results[1]).toBeNull();
            expect(results[2]).toBeNull();
            expect(results[3]).toBeNull();
            expect(results[4]).toEqual([]);
        });
    });

    describe('Performance and concurrency', () => {
        it('should handle multiple simultaneous subscriptions', async () => {
            const mockEvent = { 
                id: 1, 
                name: 'Test Event',
                status: 'IN_PROGRESS',
                bankAmount: 500
            };
            const mockUser = { 
                id: 1, 
                username: 'testuser', 
                balance: 100,
                isActivated: true
            };
            const mockParticipation = { 
                id: 1, 
                userId: 1, 
                eventId: 1, 
                deposit: 50
            };
            const mockConditions = [
                { 
                    id: 1, 
                    eventId: 1, 
                    isCompleted: false 
                }
            ];

            eventService.findById.mockResolvedValue(mockEvent);
            userService.findById.mockResolvedValue(mockUser);
            participationService.findById.mockResolvedValue(mockParticipation);
            eventEndConditionService.findByEventId.mockResolvedValue(mockConditions);

            const promises = [
                subscriptionResolvers.Subscription.eventUpdated.resolve({ eventUpdated: { id: 1 } }),
                subscriptionResolvers.Subscription.balanceUpdated.resolve({ balanceUpdated: { id: 1 } }),
                subscriptionResolvers.Subscription.participationCreated.resolve({ participationCreated: { id: 1 } }),
                subscriptionResolvers.Subscription.eventConditionsUpdated.resolve({ eventConditionsUpdated: { eventId: 1 } })
            ];

            const results = await Promise.all(promises);

            expect(results[0]).toEqual(mockEvent);
            expect(results[1]).toEqual(mockUser);
            expect(results[2]).toEqual(mockParticipation);
            expect(results[3]).toEqual(mockConditions);
        });

        it('should handle rapid successive calls to same subscription', async () => {
            const mockEvents = [
                { id: 1, name: 'Event 1' },
                { id: 2, name: 'Event 2' },
                { id: 3, name: 'Event 3' }
            ];

            eventService.findById
                .mockResolvedValueOnce(mockEvents[0])
                .mockResolvedValueOnce(mockEvents[1])
                .mockResolvedValueOnce(mockEvents[2]);

            const promises = mockEvents.map((event, index) => 
                subscriptionResolvers.Subscription.eventUpdated.resolve({ 
                    eventUpdated: { id: index + 1 } 
                })
            );

            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            expect(results[0]).toEqual(mockEvents[0]);
            expect(results[1]).toEqual(mockEvents[1]);
            expect(results[2]).toEqual(mockEvents[2]);
        });
    });

    describe('Service call validation', () => {
        it('should call eventService.findById with correct parameters', async () => {
            const mockEvent = { id: 123, name: 'Test' };
            eventService.findById.mockResolvedValue(mockEvent);

            await subscriptionResolvers.Subscription.eventUpdated.resolve({ 
                eventUpdated: { id: 123 } 
            });

            expect(eventService.findById).toHaveBeenCalledWith(123, true);
            expect(eventService.findById).toHaveBeenCalledTimes(1);
        });

        it('should call userService.findById with correct parameters', async () => {
            const mockUser = { id: 456, username: 'test' };
            userService.findById.mockResolvedValue(mockUser);

            await subscriptionResolvers.Subscription.balanceUpdated.resolve({ 
                balanceUpdated: { id: 456 } 
            });

            expect(userService.findById).toHaveBeenCalledWith(456, true);
            expect(userService.findById).toHaveBeenCalledTimes(1);
        });

        it('should call participationService.findById with correct parameters', async () => {
            const mockParticipation = { id: 789, deposit: 100 };
            participationService.findById.mockResolvedValue(mockParticipation);

            await subscriptionResolvers.Subscription.participationCreated.resolve({ 
                participationCreated: { id: 789 } 
            });

            expect(participationService.findById).toHaveBeenCalledWith(789);
            expect(participationService.findById).toHaveBeenCalledTimes(1);
        });

        it('should call eventEndConditionService.findByEventId with correct parameters', async () => {
            const mockConditions = [{ id: 1, eventId: 101 }];
            eventEndConditionService.findByEventId.mockResolvedValue(mockConditions);

            await subscriptionResolvers.Subscription.eventConditionsUpdated.resolve({ 
                eventConditionsUpdated: { eventId: 101 } 
            });

            expect(eventEndConditionService.findByEventId).toHaveBeenCalledWith(101);
            expect(eventEndConditionService.findByEventId).toHaveBeenCalledTimes(1);
        });
    });
}); 