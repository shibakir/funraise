const EventCompletionTracker = require('../../../utils/achievement/EventCompletionTracker');

// Mock dependencies
jest.mock('../../../service', () => ({
    eventService: {
        findByIdWithParticipants: jest.fn(),
        findByUser: jest.fn()
    },
    userService: {
        getAllUsers: jest.fn(),
        findByIdWithBalance: jest.fn()
    }
}));
jest.mock('../../../utils/achievement', () => ({
    onEventCompleted: jest.fn(),
    onEventParticipated: jest.fn(),
    onUserActivityUpdated: jest.fn(),
    onUserBankUpdated: jest.fn()
}));
jest.mock('../../../constants/eventPayouts', () => ({
    PAYOUT_PERCENTAGES: {
        JACKPOT: 0.9,
        DONATION: 1.0,
        FUNDRAISING: 1.0,
        DEFAULT: 0.8
    }
}));
jest.mock('../../../constants/application', () => ({
    EVENT_TYPES: {
        JACKPOT: 'JACKPOT',
        DONATION: 'DONATION',
        FUNDRAISING: 'FUNDRAISING'
    }
}));

const { eventService, userService } = require('../../../service');
const { onEventCompleted, onEventParticipated, onUserActivityUpdated, onUserBankUpdated } = require('../../../utils/achievement');

describe('EventCompletionTracker', () => {
    const mockEventId = 123;
    const mockUserId = 456;
    const mockCreatorId = 789;
    const mockRecipientId = 101;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock console methods to avoid noise in test output
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('handleEventCompletion', () => {
        const mockEvent = {
            id: mockEventId,
            type: 'JACKPOT',
            userId: mockCreatorId,
            recipientId: mockRecipientId,
            participations: [
                {
                    user: { id: mockUserId },
                    deposit: 1000
                },
                {
                    user: { id: 999 },
                    deposit: 500
                }
            ]
        };

        beforeEach(() => {
            eventService.findByIdWithParticipants.mockResolvedValue(mockEvent);
            onEventCompleted.mockResolvedValue();
        });

        it('should process event completion for all participants', async () => {
            await EventCompletionTracker.handleEventCompletion(mockEventId);

            expect(eventService.findByIdWithParticipants).toHaveBeenCalledWith(mockEventId);
            expect(onEventCompleted).toHaveBeenCalledTimes(4); // 2 participants + creator + recipient
        });

        it('should calculate total bank correctly', async () => {
            await EventCompletionTracker.handleEventCompletion(mockEventId);

            const expectedTotalBank = 1500; // 1000 + 500
            
            // Check that first participant received correct event data
            expect(onEventCompleted).toHaveBeenCalledWith(
                mockUserId,
                mockEventId,
                expect.objectContaining({
                    bankAmount: expectedTotalBank
                })
            );
        });

        it('should set correct participant count', async () => {
            await EventCompletionTracker.handleEventCompletion(mockEventId);

            expect(onEventCompleted).toHaveBeenCalledWith(
                mockUserId,
                mockEventId,
                expect.objectContaining({
                    participantsCount: 2
                })
            );
        });

        it('should calculate payout for JACKPOT events correctly', async () => {
            const jackpotEvent = { ...mockEvent, type: 'JACKPOT' };
            eventService.findByIdWithParticipants.mockResolvedValue(jackpotEvent);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            const expectedTotalPayout = Math.floor(1500 * 0.9); // 1350

            // Participants should get potential to win full payout in JACKPOT
            expect(onEventCompleted).toHaveBeenCalledWith(
                mockUserId,
                mockEventId,
                expect.objectContaining({
                    userIncome: expectedTotalPayout
                })
            );
        });

        it('should handle DONATION events correctly', async () => {
            const donationEvent = { ...mockEvent, type: 'DONATION' };
            eventService.findByIdWithParticipants.mockResolvedValue(donationEvent);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            // Participants don't get income in DONATION events
            expect(onEventCompleted).toHaveBeenCalledWith(
                mockUserId,
                mockEventId,
                expect.objectContaining({
                    userIncome: 0
                })
            );
        });

        it('should track achievements for event creator when not a participant', async () => {
            const eventWithoutCreatorParticipation = {
                ...mockEvent,
                participations: [
                    { user: { id: mockUserId }, deposit: 1000 }
                ]
            };
            eventService.findByIdWithParticipants.mockResolvedValue(eventWithoutCreatorParticipation);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            // Should track for participant, creator, and recipient
            expect(onEventCompleted).toHaveBeenCalledTimes(3);
            expect(onEventCompleted).toHaveBeenCalledWith(
                mockCreatorId,
                mockEventId,
                expect.objectContaining({
                    userIncome: 0 // Creator doesn't get income for creating
                })
            );
        });

        it('should track achievements for recipient when different from creator and participants', async () => {
            await EventCompletionTracker.handleEventCompletion(mockEventId);

            expect(onEventCompleted).toHaveBeenCalledWith(
                mockRecipientId,
                mockEventId,
                expect.objectContaining({
                    userIncome: Math.floor(1500 * 0.9) // Recipient gets the payout
                })
            );
        });

        it('should not duplicate tracking when creator is a participant', async () => {
            const eventWithCreatorParticipation = {
                ...mockEvent,
                participations: [
                    { user: { id: mockCreatorId }, deposit: 1000 }, // Creator participates
                    { user: { id: mockUserId }, deposit: 500 }
                ]
            };
            eventService.findByIdWithParticipants.mockResolvedValue(eventWithCreatorParticipation);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            // Should track for participants and recipient only (no separate creator tracking)
            expect(onEventCompleted).toHaveBeenCalledTimes(3); // 2 participants + recipient
        });

        it('should not duplicate tracking when recipient is a participant', async () => {
            const eventWithRecipientParticipation = {
                ...mockEvent,
                recipientId: mockUserId, // Recipient is also a participant
                participations: [
                    { user: { id: mockUserId }, deposit: 1000 }, // Recipient participates
                    { user: { id: 999 }, deposit: 500 }
                ]
            };
            eventService.findByIdWithParticipants.mockResolvedValue(eventWithRecipientParticipation);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            // Should track for participants and creator only (no separate recipient tracking)
            expect(onEventCompleted).toHaveBeenCalledTimes(3); // 2 participants + creator
        });

        it('should handle events with no participants', async () => {
            const eventWithNoParticipants = {
                ...mockEvent,
                participations: []
            };
            eventService.findByIdWithParticipants.mockResolvedValue(eventWithNoParticipants);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            // Should still track for creator and recipient
            expect(onEventCompleted).toHaveBeenCalledTimes(2);
        });

        it('should handle events with no recipient', async () => {
            const eventWithNoRecipient = {
                ...mockEvent,
                recipientId: null
            };
            eventService.findByIdWithParticipants.mockResolvedValue(eventWithNoRecipient);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            // Should track for participants and creator only
            expect(onEventCompleted).toHaveBeenCalledTimes(3); // 2 participants + creator
        });

        it('should throw error when event is not found', async () => {
            eventService.findByIdWithParticipants.mockResolvedValue(null);

            await expect(EventCompletionTracker.handleEventCompletion(mockEventId))
                .rejects
                .toThrow(`Event with ID ${mockEventId} not found`);
        });

        it('should handle database errors gracefully', async () => {
            const dbError = new Error('Database connection failed');
            eventService.findByIdWithParticipants.mockRejectedValue(dbError);

            await expect(EventCompletionTracker.handleEventCompletion(mockEventId))
                .rejects
                .toThrow('Database connection failed');
        });
    });

    describe('handleEventParticipation', () => {
        it('should track event participation', async () => {
            const depositAmount = 1500;

            await EventCompletionTracker.handleEventParticipation(mockUserId, mockEventId, depositAmount);

            expect(onEventParticipated).toHaveBeenCalledWith(mockUserId, mockEventId);
        });

        it('should handle errors during participation tracking', async () => {
            const participationError = new Error('Participation tracking failed');
            onEventParticipated.mockRejectedValue(participationError);

            await expect(
                EventCompletionTracker.handleEventParticipation(mockUserId, mockEventId, 1000)
            ).rejects.toThrow('Participation tracking failed');
        });
    });

    describe('updateUserActivityStreak', () => {
        beforeEach(() => {
            EventCompletionTracker.calculateActivityStreak = jest.fn();
            onUserActivityUpdated.mockResolvedValue();
        });

        it('should update user activity when streak is positive', async () => {
            const streakDays = 7;
            EventCompletionTracker.calculateActivityStreak.mockResolvedValue(streakDays);

            await EventCompletionTracker.updateUserActivityStreak(mockUserId);

            expect(EventCompletionTracker.calculateActivityStreak).toHaveBeenCalledWith(mockUserId);
            expect(onUserActivityUpdated).toHaveBeenCalledWith(mockUserId, streakDays);
        });

        it('should not update user activity when streak is zero', async () => {
            EventCompletionTracker.calculateActivityStreak.mockResolvedValue(0);

            await EventCompletionTracker.updateUserActivityStreak(mockUserId);

            expect(EventCompletionTracker.calculateActivityStreak).toHaveBeenCalledWith(mockUserId);
            expect(onUserActivityUpdated).not.toHaveBeenCalled();
        });
    });

    describe('calculateActivityStreak', () => {
        const mockEvents = [
            { createdAt: new Date('2023-01-01') },
            { createdAt: new Date('2023-01-01') }, // Same day
            { createdAt: new Date('2023-01-02') },
            { createdAt: new Date('2023-01-03') }
        ];

        beforeEach(() => {
            eventService.findByUser.mockResolvedValue(mockEvents);
        });

        it('should handle errors during event retrieval', async () => {
            const eventsError = new Error('Events retrieval failed');
            eventService.findByUser.mockRejectedValue(eventsError);

            const result = await EventCompletionTracker.calculateActivityStreak(mockUserId);

            expect(result).toBe(0);
        });
    });

    describe('bulkUpdateAchievements', () => {
        const mockUsers = [
            { id: 1, balance: 5000 },
            { id: 2, balance: 3000 },
            { id: 3, balance: 7500 }
        ];

        beforeEach(() => {
            userService.getAllUsers.mockResolvedValue(mockUsers);
            userService.findByIdWithBalance.mockImplementation((id) => 
                Promise.resolve(mockUsers.find(user => user.id === id))
            );
            EventCompletionTracker.updateUserActivityStreak = jest.fn().mockResolvedValue();
            onUserBankUpdated.mockResolvedValue();
        });

        it('should update achievements for all users', async () => {
            await EventCompletionTracker.bulkUpdateAchievements();

            expect(userService.getAllUsers).toHaveBeenCalledTimes(1);
            expect(EventCompletionTracker.updateUserActivityStreak).toHaveBeenCalledTimes(3);
            expect(userService.findByIdWithBalance).toHaveBeenCalledTimes(3);
            expect(onUserBankUpdated).toHaveBeenCalledTimes(3);

            // Check that each user was processed correctly
            mockUsers.forEach(user => {
                expect(EventCompletionTracker.updateUserActivityStreak).toHaveBeenCalledWith(user.id);
                expect(onUserBankUpdated).toHaveBeenCalledWith(user.id, user.balance);
            });
        });

        it('should handle missing user balance gracefully', async () => {
            userService.findByIdWithBalance.mockResolvedValueOnce(null);

            await EventCompletionTracker.bulkUpdateAchievements();

            expect(EventCompletionTracker.updateUserActivityStreak).toHaveBeenCalledTimes(3);
            expect(onUserBankUpdated).toHaveBeenCalledTimes(2); // Only 2 users have balance
        });

        it('should handle errors during bulk update', async () => {
            const bulkError = new Error('Bulk update failed');
            userService.getAllUsers.mockRejectedValue(bulkError);

            await expect(EventCompletionTracker.bulkUpdateAchievements())
                .rejects
                .toThrow('Bulk update failed');
        });

        it('should continue processing even if individual user update fails', async () => {
            const userError = new Error('User update failed');
            EventCompletionTracker.updateUserActivityStreak.mockRejectedValueOnce(userError);

            await expect(EventCompletionTracker.bulkUpdateAchievements())
                .rejects
                .toThrow('User update failed');

            // Should have tried to process the first user
            expect(EventCompletionTracker.updateUserActivityStreak).toHaveBeenCalledWith(1);
        });
    });

    describe('Integration tests', () => {
        it('should properly integrate with achievement system', async () => {
            const completeEvent = {
                id: mockEventId,
                type: 'JACKPOT',
                userId: mockCreatorId,
                recipientId: null,
                participations: [
                    { user: { id: mockUserId }, deposit: 2000 }
                ]
            };
            eventService.findByIdWithParticipants.mockResolvedValue(completeEvent);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            // Verify that achievement tracking was called with correct data structure
            expect(onEventCompleted).toHaveBeenCalledWith(
                mockUserId,
                mockEventId,
                expect.objectContaining({
                    bankAmount: expect.any(Number),
                    participantsCount: expect.any(Number),
                    completedAt: expect.any(Date),
                    userIncome: expect.any(Number)
                })
            );
        });

        it('should handle complex event scenarios', async () => {
            const complexEvent = {
                id: mockEventId,
                type: 'FUNDRAISING',
                userId: 100, // Creator
                recipientId: 200, // Different recipient
                participations: [
                    { user: { id: 100 }, deposit: 500 }, // Creator also participates
                    { user: { id: 300 }, deposit: 1000 },
                    { user: { id: 400 }, deposit: 750 }
                ]
            };
            eventService.findByIdWithParticipants.mockResolvedValue(complexEvent);

            await EventCompletionTracker.handleEventCompletion(mockEventId);

            // Should track for 3 participants + recipient (creator already tracked as participant)
            expect(onEventCompleted).toHaveBeenCalledTimes(4);
            
            // Verify recipient gets the full payout for FUNDRAISING
            expect(onEventCompleted).toHaveBeenCalledWith(
                200, // recipient
                mockEventId,
                expect.objectContaining({
                    userIncome: 2250 // Full bank amount for FUNDRAISING (1.0 payout)
                })
            );
        });
    });
}); 