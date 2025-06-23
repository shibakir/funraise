const EventConditionTracker = require('../../../utils/eventCondition/EventConditionTracker');

// Mock services
const mockServices = {
    eventService: {
        findByIdWithParticipants: jest.fn(),
        findByIdWithEndConditions: jest.fn(),
        updateStatus: jest.fn()
    },
    eventEndConditionService: {
        findById: jest.fn(),
        findByEventWithConditions: jest.fn(),
        updateCompletion: jest.fn(),
        updateFailure: jest.fn()
    },
    endConditionService: {
        findById: jest.fn(),
        findByEventEndCondition: jest.fn(),
        updateCompletion: jest.fn()
    },
    participationService: {
        findByEvent: jest.fn()
    },
    transactionService: {
        create: jest.fn()
    }
};

const mockPubsub = {
    pubsub: {
        publish: jest.fn()
    },
    SUBSCRIPTION_EVENTS: {
        EVENT_UPDATED: 'EVENT_UPDATED',
        EVENT_CONDITIONS_UPDATED: 'EVENT_CONDITIONS_UPDATED',
        BALANCE_UPDATED: 'BALANCE_UPDATED'
    }
};

// Mock modules
jest.mock('../../../service', () => mockServices);
jest.mock('../../../graphql/pubsub', () => mockPubsub);
jest.mock('../../../utils/achievement/EventCompletionTracker', () => ({
    handleEventCompletion: jest.fn().mockResolvedValue()
}));

const EventCompletionTracker = require('../../../utils/achievement/EventCompletionTracker');

describe('EventConditionTracker', () => {
    let eventConditionTracker;

    beforeEach(() => {
        jest.clearAllMocks();
        eventConditionTracker = new EventConditionTracker();
        EventCompletionTracker.handleEventCompletion.mockResolvedValue();
    });

    describe('checkCondition', () => {
        it('should return true for EQUALS operator when values match', () => {
            const endCondition = { operator: 'EQUALS', value: '100' };
            const result = eventConditionTracker.checkCondition(endCondition, 100);
            expect(result).toBe(true);
        });

        it('should return false for EQUALS operator when values do not match', () => {
            const endCondition = { operator: 'EQUALS', value: '100' };
            const result = eventConditionTracker.checkCondition(endCondition, 50);
            expect(result).toBe(false);
        });

        it('should return true for GREATER operator when current value is greater', () => {
            const endCondition = { operator: 'GREATER', value: '50' };
            const result = eventConditionTracker.checkCondition(endCondition, 100);
            expect(result).toBe(true);
        });

        it('should return false for GREATER operator when current value is not greater', () => {
            const endCondition = { operator: 'GREATER', value: '100' };
            const result = eventConditionTracker.checkCondition(endCondition, 50);
            expect(result).toBe(false);
        });

        it('should return true for LESS operator when current value is less', () => {
            const endCondition = { operator: 'LESS', value: '100' };
            const result = eventConditionTracker.checkCondition(endCondition, 50);
            expect(result).toBe(true);
        });

        it('should return true for GREATER_EQUALS operator when values are equal', () => {
            const endCondition = { operator: 'GREATER_EQUALS', value: '100' };
            const result = eventConditionTracker.checkCondition(endCondition, 100);
            expect(result).toBe(true);
        });

        it('should return true for LESS_EQUALS operator when current value is less', () => {
            const endCondition = { operator: 'LESS_EQUALS', value: '100' };
            const result = eventConditionTracker.checkCondition(endCondition, 50);
            expect(result).toBe(true);
        });

        it('should return false for unknown operator', () => {
            const endCondition = { operator: 'UNKNOWN', value: '100' };
            const result = eventConditionTracker.checkCondition(endCondition, 50);
            expect(result).toBe(false);
        });
    });

    describe('getPeopleCount', () => {
        it('should return the number of participants', async () => {
            const mockEvent = {
                participations: [
                    { userId: 1, deposit: 100 },
                    { userId: 2, deposit: 200 },
                    { userId: 3, deposit: 150 }
                ]
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            const result = await eventConditionTracker.getPeopleCount(1);

            expect(mockServices.eventService.findByIdWithParticipants).toHaveBeenCalledWith(1);
            expect(result).toBe(3);
        });

        it('should return 0 when there are no participants', async () => {
            const mockEvent = { participations: [] };
            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            const result = await eventConditionTracker.getPeopleCount(1);

            expect(result).toBe(0);
        });

        it('should return 0 when event is not found', async () => {
            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(null);

            const result = await eventConditionTracker.getPeopleCount(999);

            expect(result).toBe(0);
        });

        it('should return 0 when participations is null', async () => {
            const mockEvent = { participations: null };
            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            const result = await eventConditionTracker.getPeopleCount(1);

            expect(result).toBe(0);
        });

        it('should handle errors gracefully', async () => {
            mockServices.eventService.findByIdWithParticipants.mockRejectedValue(new Error('Database error'));

            const result = await eventConditionTracker.getPeopleCount(1);

            expect(result).toBe(0);
        });
    });

    describe('getBankAmount', () => {
        it('should calculate total deposit amount from all participants', async () => {
            const mockEvent = {
                participations: [
                    { userId: 1, deposit: 100 },
                    { userId: 2, deposit: 200 },
                    { userId: 3, deposit: 150 }
                ]
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            const result = await eventConditionTracker.getBankAmount(1);

            expect(mockServices.eventService.findByIdWithParticipants).toHaveBeenCalledWith(1);
            expect(result).toBe(450);
        });

        it('should handle null deposit values', async () => {
            const mockEvent = {
                participations: [
                    { userId: 1, deposit: 100 },
                    { userId: 2, deposit: null },
                    { userId: 3, deposit: 200 }
                ]
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            const result = await eventConditionTracker.getBankAmount(1);

            expect(result).toBe(300);
        });

        it('should return 0 when there are no participants', async () => {
            const mockEvent = { participations: [] };
            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            const result = await eventConditionTracker.getBankAmount(1);

            expect(result).toBe(0);
        });

        it('should return 0 when event is not found', async () => {
            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(null);

            const result = await eventConditionTracker.getBankAmount(999);

            expect(result).toBe(0);
        });

        it('should handle errors gracefully', async () => {
            mockServices.eventService.findByIdWithParticipants.mockRejectedValue(new Error('Database error'));

            const result = await eventConditionTracker.getBankAmount(1);

            expect(result).toBe(0);
        });
    });

    describe('getTimeCondition', () => {
        beforeAll(() => {
            // Mock Date for consistent testing
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('should return true when current time is after target time', async () => {
            const targetTime = '2024-01-10T12:00:00Z';
            const result = await eventConditionTracker.getTimeCondition(1, targetTime);
            expect(result).toBe(true);
        });

        it('should return false when current time is before target time', async () => {
            const targetTime = '2024-01-20T12:00:00Z';
            const result = await eventConditionTracker.getTimeCondition(1, targetTime);
            expect(result).toBe(false);
        });

        it('should return true when current time equals target time', async () => {
            const targetTime = '2024-01-15T12:00:00Z';
            const result = await eventConditionTracker.getTimeCondition(1, targetTime);
            expect(result).toBe(true);
        });

        it('should handle invalid date strings gracefully', async () => {
            const invalidTime = 'invalid-date';
            const result = await eventConditionTracker.getTimeCondition(1, invalidTime);
            expect(result).toBe(false);
        });
    });

    describe('getCurrentValue', () => {
        beforeEach(() => {
            jest.spyOn(eventConditionTracker, 'getPeopleCount').mockResolvedValue(5);
            jest.spyOn(eventConditionTracker, 'getBankAmount').mockResolvedValue(1000);
            jest.spyOn(eventConditionTracker, 'getTimeCondition').mockResolvedValue(true);
        });

        it('should return people count for PARTICIPATION condition', async () => {
            const endCondition = { name: 'PARTICIPATION' };
            const result = await eventConditionTracker.getCurrentValue(endCondition, 1);
            
            expect(eventConditionTracker.getPeopleCount).toHaveBeenCalledWith(1);
            expect(result).toBe(5);
        });

        it('should return bank amount for BANK condition', async () => {
            const endCondition = { name: 'BANK' };
            const result = await eventConditionTracker.getCurrentValue(endCondition, 1);
            
            expect(eventConditionTracker.getBankAmount).toHaveBeenCalledWith(1);
            expect(result).toBe(1000);
        });

        it('should return 1 for TIME condition when time is reached', async () => {
            const endCondition = { name: 'TIME', value: '2024-01-01' };
            eventConditionTracker.getTimeCondition.mockResolvedValue(true);
            
            const result = await eventConditionTracker.getCurrentValue(endCondition, 1);
            
            expect(eventConditionTracker.getTimeCondition).toHaveBeenCalledWith(1, '2024-01-01');
            expect(result).toBe(1);
        });

        it('should return 0 for TIME condition when time is not reached', async () => {
            const endCondition = { name: 'TIME', value: '2024-12-31' };
            eventConditionTracker.getTimeCondition.mockResolvedValue(false);
            
            const result = await eventConditionTracker.getCurrentValue(endCondition, 1);
            
            expect(result).toBe(0);
        });

        it('should return 0 for unknown condition type', async () => {
            const endCondition = { name: 'UNKNOWN' };
            const result = await eventConditionTracker.getCurrentValue(endCondition, 1);
            
            expect(result).toBe(0);
        });
    });

    describe('checkAndUpdateEndCondition', () => {
        it('should complete condition when condition is met', async () => {
            const mockEndCondition = {
                id: 1,
                name: 'PARTICIPATION',
                operator: 'GREATER_EQUALS',
                value: '5',
                isCompleted: false,
                endConditionId: 10
            };

            mockServices.endConditionService.findById.mockResolvedValue(mockEndCondition);
            jest.spyOn(eventConditionTracker, 'getCurrentValue').mockResolvedValue(10);
            jest.spyOn(eventConditionTracker, 'checkAndUpdateEventEndCondition').mockResolvedValue();

            await eventConditionTracker.checkAndUpdateEndCondition(1, 100);

            expect(mockServices.endConditionService.findById).toHaveBeenCalledWith(1);
            expect(mockServices.endConditionService.updateCompletion).toHaveBeenCalledWith(1, true);
            expect(eventConditionTracker.checkAndUpdateEventEndCondition).toHaveBeenCalledWith(10, 100);
        });

        it('should not update condition when already completed', async () => {
            const mockEndCondition = {
                id: 1,
                name: 'PARTICIPATION',
                operator: 'GREATER_EQUALS',
                value: '5',
                isCompleted: true
            };

            mockServices.endConditionService.findById.mockResolvedValue(mockEndCondition);

            await eventConditionTracker.checkAndUpdateEndCondition(1, 100);

            expect(mockServices.endConditionService.updateCompletion).not.toHaveBeenCalled();
        });

        it('should not update condition when condition is not met', async () => {
            const mockEndCondition = {
                id: 1,
                name: 'PARTICIPATION',
                operator: 'GREATER_EQUALS',
                value: '10',
                isCompleted: false
            };

            mockServices.endConditionService.findById.mockResolvedValue(mockEndCondition);
            jest.spyOn(eventConditionTracker, 'getCurrentValue').mockResolvedValue(5);

            await eventConditionTracker.checkAndUpdateEndCondition(1, 100);

            expect(mockServices.endConditionService.updateCompletion).not.toHaveBeenCalled();
        });

        it('should handle time condition deadline failure', async () => {
            const mockEndCondition = {
                id: 1,
                name: 'TIME',
                operator: 'EQUALS',
                value: '2024-01-01',
                isCompleted: false,
                endConditionId: 10
            };

            mockServices.endConditionService.findById.mockResolvedValue(mockEndCondition);
            jest.spyOn(eventConditionTracker, 'getCurrentValue').mockResolvedValue(0);
            jest.spyOn(eventConditionTracker, 'getTimeCondition').mockResolvedValue(true);
            jest.spyOn(eventConditionTracker, 'checkGroupFailureOnTimeDeadline').mockResolvedValue();

            await eventConditionTracker.checkAndUpdateEndCondition(1, 100);

            expect(eventConditionTracker.checkGroupFailureOnTimeDeadline).toHaveBeenCalledWith(10, 100);
        });

        it('should handle condition not found gracefully', async () => {
            mockServices.endConditionService.findById.mockResolvedValue(null);

            await eventConditionTracker.checkAndUpdateEndCondition(999, 100);

            expect(mockServices.endConditionService.updateCompletion).not.toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            mockServices.endConditionService.findById.mockRejectedValue(new Error('Database error'));

            await expect(eventConditionTracker.checkAndUpdateEndCondition(1, 100)).resolves.not.toThrow();
        });
    });

    describe('checkAndUpdateEventEndCondition', () => {
        it('should complete group when all conditions are met', async () => {
            const mockEventEndCondition = {
                id: 10,
                isCompleted: false,
                isFailed: false
            };

            const mockConditions = [
                { id: 1, isCompleted: true },
                { id: 2, isCompleted: true }
            ];

            mockServices.eventEndConditionService.findById.mockResolvedValue(mockEventEndCondition);
            mockServices.endConditionService.findByEventEndCondition.mockResolvedValue(mockConditions);
            jest.spyOn(eventConditionTracker, 'checkAndUpdateEvent').mockResolvedValue();

            await eventConditionTracker.checkAndUpdateEventEndCondition(10, 100);

            expect(mockServices.eventEndConditionService.updateCompletion).toHaveBeenCalledWith(10, true);
            expect(mockPubsub.pubsub.publish).toHaveBeenCalledWith('EVENT_CONDITIONS_UPDATED', {
                eventConditionsUpdated: { eventId: 100 }
            });
            expect(eventConditionTracker.checkAndUpdateEvent).toHaveBeenCalledWith(100);
        });

        it('should not complete group when some conditions are not met', async () => {
            const mockEventEndCondition = {
                id: 10,
                isCompleted: false,
                isFailed: false
            };

            const mockConditions = [
                { id: 1, isCompleted: true },
                { id: 2, isCompleted: false }
            ];

            mockServices.eventEndConditionService.findById.mockResolvedValue(mockEventEndCondition);
            mockServices.endConditionService.findByEventEndCondition.mockResolvedValue(mockConditions);

            await eventConditionTracker.checkAndUpdateEventEndCondition(10, 100);

            expect(mockServices.eventEndConditionService.updateCompletion).not.toHaveBeenCalled();
        });

        it('should not update already completed group', async () => {
            const mockEventEndCondition = {
                id: 10,
                isCompleted: true,
                isFailed: false
            };

            mockServices.eventEndConditionService.findById.mockResolvedValue(mockEventEndCondition);

            await eventConditionTracker.checkAndUpdateEventEndCondition(10, 100);

            expect(mockServices.endConditionService.findByEventEndCondition).not.toHaveBeenCalled();
        });

        it('should not update already failed group', async () => {
            const mockEventEndCondition = {
                id: 10,
                isCompleted: false,
                isFailed: true
            };

            mockServices.eventEndConditionService.findById.mockResolvedValue(mockEventEndCondition);

            await eventConditionTracker.checkAndUpdateEventEndCondition(10, 100);

            expect(mockServices.endConditionService.findByEventEndCondition).not.toHaveBeenCalled();
        });

        it('should not complete group when no conditions exist', async () => {
            const mockEventEndCondition = {
                id: 10,
                isCompleted: false,
                isFailed: false
            };

            mockServices.eventEndConditionService.findById.mockResolvedValue(mockEventEndCondition);
            mockServices.endConditionService.findByEventEndCondition.mockResolvedValue([]);

            await eventConditionTracker.checkAndUpdateEventEndCondition(10, 100);

            expect(mockServices.eventEndConditionService.updateCompletion).not.toHaveBeenCalled();
        });
    });

    describe('checkAndUpdateEvent', () => {
        it('should mark event as FINISHED when at least one group is completed', async () => {
            const mockEvent = {
                id: 100,
                status: 'IN_PROGRESS',
                endConditions: [
                    { id: 1, isCompleted: true, isFailed: false },
                    { id: 2, isCompleted: false, isFailed: false }
                ]
            };

            mockServices.eventService.findByIdWithEndConditions.mockResolvedValue(mockEvent);
            jest.spyOn(eventConditionTracker, 'onEventCompleted').mockResolvedValue();

            await eventConditionTracker.checkAndUpdateEvent(100);

            expect(mockServices.eventService.updateStatus).toHaveBeenCalledWith(100, 'FINISHED');
            expect(mockPubsub.pubsub.publish).toHaveBeenCalledWith('EVENT_UPDATED', {
                eventUpdated: { id: 100 }
            });
            expect(eventConditionTracker.onEventCompleted).toHaveBeenCalledWith(100);
        });

        it('should mark event as FAILED when all groups have failed', async () => {
            const mockEvent = {
                id: 100,
                status: 'IN_PROGRESS',
                endConditions: [
                    { id: 1, isCompleted: false, isFailed: true },
                    { id: 2, isCompleted: false, isFailed: true }
                ]
            };

            mockServices.eventService.findByIdWithEndConditions.mockResolvedValue(mockEvent);
            jest.spyOn(eventConditionTracker, 'onEventFailed').mockResolvedValue();

            await eventConditionTracker.checkAndUpdateEvent(100);

            expect(mockServices.eventService.updateStatus).toHaveBeenCalledWith(100, 'FAILED');
            expect(mockPubsub.pubsub.publish).toHaveBeenCalledWith('EVENT_UPDATED', {
                eventUpdated: { id: 100 }
            });
            expect(eventConditionTracker.onEventFailed).toHaveBeenCalledWith(100);
        });

        it('should not update status when event is already finished', async () => {
            const mockEvent = {
                id: 100,
                status: 'FINISHED',
                endConditions: []
            };

            mockServices.eventService.findByIdWithEndConditions.mockResolvedValue(mockEvent);

            await eventConditionTracker.checkAndUpdateEvent(100);

            expect(mockServices.eventService.updateStatus).not.toHaveBeenCalled();
        });

        it('should not update status when some groups are still in progress', async () => {
            const mockEvent = {
                id: 100,
                status: 'IN_PROGRESS',
                endConditions: [
                    { id: 1, isCompleted: false, isFailed: false },
                    { id: 2, isCompleted: false, isFailed: true }
                ]
            };

            mockServices.eventService.findByIdWithEndConditions.mockResolvedValue(mockEvent);

            await eventConditionTracker.checkAndUpdateEvent(100);

            expect(mockServices.eventService.updateStatus).not.toHaveBeenCalled();
        });
    });

    describe('onEventCompleted', () => {
        beforeEach(() => {
            // Clear all mocks and reset achievement tracker
            jest.clearAllMocks();
            EventCompletionTracker.handleEventCompletion.mockResolvedValue();
        });

        it('should process FUNDRAISING event payout correctly', async () => {
            const mockEvent = {
                id: 100,
                type: 'FUNDRAISING',
                recipientId: 5,
                participations: [
                    { userId: 1, deposit: 100 },
                    { userId: 2, deposit: 200 }
                ]
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            await eventConditionTracker.onEventCompleted(100);

            expect(EventCompletionTracker.handleEventCompletion).toHaveBeenCalledWith(100);
            expect(mockServices.transactionService.create).toHaveBeenCalledWith({
                amount: 294, // 300 * 0.98
                type: 'EVENT_INCOME',
                userId: 5
            });
            expect(mockPubsub.pubsub.publish).toHaveBeenCalledWith('BALANCE_UPDATED', {
                balanceUpdated: { id: 5 }
            });
        });

        it('should process DONATION event payout correctly', async () => {
            const mockEvent = {
                id: 100,
                type: 'DONATION',
                recipientId: 5,
                participations: [
                    { userId: 1, deposit: 100 },
                    { userId: 2, deposit: 200 }
                ]
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            await eventConditionTracker.onEventCompleted(100);

            expect(mockServices.transactionService.create).toHaveBeenCalledWith({
                amount: 288, // 300 * 0.96
                type: 'EVENT_INCOME',
                userId: 5
            });
        });

        it('should process JACKPOT event with random winner selection', async () => {
            const mockEvent = {
                id: 100,
                type: 'JACKPOT',
                participations: [
                    { userId: 1, deposit: 100 },
                    { userId: 2, deposit: 200 },
                    { userId: 3, deposit: 50 }
                ]
            };

            // Mock Math.random to return predictable value
            const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            await eventConditionTracker.onEventCompleted(100);

            expect(EventCompletionTracker.handleEventCompletion).toHaveBeenCalledWith(100);
            expect(mockServices.transactionService.create).toHaveBeenCalledWith({
                amount: 315, // 350 * 0.90
                type: 'EVENT_INCOME',
                userId: expect.any(Number) // Winner should be one of the participants
            });

            mockRandom.mockRestore();
        });

        it('should skip payout when event has no funds', async () => {
            const mockEvent = {
                id: 100,
                type: 'FUNDRAISING',
                recipientId: 5,
                participations: []
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            await eventConditionTracker.onEventCompleted(100);

            expect(EventCompletionTracker.handleEventCompletion).toHaveBeenCalledWith(100);
            expect(mockServices.transactionService.create).not.toHaveBeenCalled();
        });

        it('should skip payout when event has no recipient for DONATION', async () => {
            const mockEvent = {
                id: 100,
                type: 'DONATION',
                recipientId: null,
                participations: [
                    { userId: 1, deposit: 100 }
                ]
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            await eventConditionTracker.onEventCompleted(100);

            expect(mockServices.transactionService.create).not.toHaveBeenCalled();
        });

        it('should continue with payout even if achievement tracking fails', async () => {
            const mockEvent = {
                id: 100,
                type: 'FUNDRAISING',
                recipientId: 5,
                participations: [
                    { userId: 1, deposit: 100 }
                ]
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);
            EventCompletionTracker.handleEventCompletion.mockRejectedValue(new Error('Achievement error'));

            await eventConditionTracker.onEventCompleted(100);

            expect(mockServices.transactionService.create).toHaveBeenCalledWith({
                amount: 98, // 100 * 0.98
                type: 'EVENT_INCOME',
                userId: 5
            });
        });

        it('should use default payout for unknown event type', async () => {
            const mockEvent = {
                id: 100,
                type: 'UNKNOWN_TYPE',
                recipientId: 5,
                participations: [
                    { userId: 1, deposit: 100 }
                ]
            };

            mockServices.eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);

            await eventConditionTracker.onEventCompleted(100);

            expect(mockServices.transactionService.create).toHaveBeenCalledWith({
                amount: 100, // 100 * 1.0 (DEFAULT)
                type: 'EVENT_INCOME',
                userId: 5
            });
        });

        it('should handle errors gracefully', async () => {
            mockServices.eventService.findByIdWithParticipants.mockRejectedValue(new Error('Database error'));

            await expect(eventConditionTracker.onEventCompleted(100)).resolves.not.toThrow();
        });
    });

    describe('checkGroupFailureOnTimeDeadline', () => {
        it('should mark group as failed when time deadline is reached and other conditions are not met', async () => {
            const mockEventEndCondition = {
                id: 10,
                isCompleted: false,
                isFailed: false
            };

            const mockConditions = [
                { id: 1, name: 'TIME', isCompleted: false },
                { id: 2, name: 'PARTICIPATION', isCompleted: false }
            ];

            mockServices.eventEndConditionService.findById.mockResolvedValue(mockEventEndCondition);
            mockServices.endConditionService.findByEventEndCondition.mockResolvedValue(mockConditions);
            jest.spyOn(eventConditionTracker, 'checkAndUpdateEvent').mockResolvedValue();

            await eventConditionTracker.checkGroupFailureOnTimeDeadline(10, 100);

            expect(mockServices.eventEndConditionService.updateFailure).toHaveBeenCalledWith(10, true);
            expect(mockPubsub.pubsub.publish).toHaveBeenCalledWith('EVENT_CONDITIONS_UPDATED', {
                eventConditionsUpdated: { eventId: 100 }
            });
            expect(eventConditionTracker.checkAndUpdateEvent).toHaveBeenCalledWith(100);
        });

        it('should not mark group as failed when all non-time conditions are completed', async () => {
            const mockEventEndCondition = {
                id: 10,
                isCompleted: false,
                isFailed: false
            };

            const mockConditions = [
                { id: 1, name: 'TIME', isCompleted: false },
                { id: 2, name: 'PARTICIPATION', isCompleted: true }
            ];

            mockServices.eventEndConditionService.findById.mockResolvedValue(mockEventEndCondition);
            mockServices.endConditionService.findByEventEndCondition.mockResolvedValue(mockConditions);

            await eventConditionTracker.checkGroupFailureOnTimeDeadline(10, 100);

            expect(mockServices.eventEndConditionService.updateFailure).not.toHaveBeenCalled();
        });

        it('should not update already completed or failed group', async () => {
            const mockEventEndCondition = {
                id: 10,
                isCompleted: true,
                isFailed: false
            };

            mockServices.eventEndConditionService.findById.mockResolvedValue(mockEventEndCondition);

            await eventConditionTracker.checkGroupFailureOnTimeDeadline(10, 100);

            expect(mockServices.endConditionService.findByEventEndCondition).not.toHaveBeenCalled();
        });
    });

    describe('checkAllEventConditions', () => {
        it('should check all uncompleted conditions for an event', async () => {
            const mockEventEndConditions = [
                {
                    id: 1,
                    isCompleted: false,
                    isFailed: false,
                    conditions: [
                        { id: 1, isCompleted: false },
                        { id: 2, isCompleted: true }
                    ]
                },
                {
                    id: 2,
                    isCompleted: true,
                    isFailed: false,
                    conditions: [
                        { id: 3, isCompleted: true }
                    ]
                }
            ];

            mockServices.eventEndConditionService.findByEventWithConditions.mockResolvedValue(mockEventEndConditions);
            jest.spyOn(eventConditionTracker, 'checkAndUpdateEndCondition').mockResolvedValue();

            await eventConditionTracker.checkAllEventConditions(100);

            expect(mockServices.eventEndConditionService.findByEventWithConditions).toHaveBeenCalledWith(100);
            expect(eventConditionTracker.checkAndUpdateEndCondition).toHaveBeenCalledTimes(1);
            expect(eventConditionTracker.checkAndUpdateEndCondition).toHaveBeenCalledWith(1, 100);
        });

        it('should handle errors gracefully', async () => {
            mockServices.eventEndConditionService.findByEventWithConditions.mockRejectedValue(new Error('Database error'));

            await expect(eventConditionTracker.checkAllEventConditions(100)).resolves.not.toThrow();
        });
    });

    describe('onEventFailed', () => {
        it('should handle event failure without errors', async () => {
            await expect(eventConditionTracker.onEventFailed(100)).resolves.not.toThrow();
        });
    });
}); 