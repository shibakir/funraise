const { 
    CriterionManager, 
    EventCriterionTracker, 
    UserCriterionTracker,
    AchievementTracker 
} = require('../../../utils/achievement/CriterionTrackers');

// Mock dependencies
jest.mock('../../../utils/achievement/AchievementTracker');

describe('CriterionTrackers', () => {
    let mockAchievementTracker;
    const mockUserId = 123;
    const mockEventId = 456;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create mock achievement tracker
        mockAchievementTracker = {
            updateProgress: jest.fn().mockResolvedValue(),
            initializeUserAchievements: jest.fn().mockResolvedValue(),
            getUserAchievements: jest.fn().mockResolvedValue([])
        };
        
        // Mock the AchievementTracker constructor
        AchievementTracker.mockImplementation(() => mockAchievementTracker);
        
        // Mock console methods to avoid noise in test output
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('EventCriterionTracker', () => {
        let tracker;

        beforeEach(() => {
            tracker = new EventCriterionTracker();
        });

        describe('trackEventBankCompleted', () => {
            it('should track bank completion with max update type', async () => {
                const bankAmount = 5000;

                await tracker.trackEventBankCompleted(mockUserId, mockEventId, bankAmount);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'EVENT_BANK_COMPLETED',
                    bankAmount,
                    { updateType: 'max' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackEventBankCompleted(mockUserId, mockEventId, 1000))
                    .resolves
                    .toBeUndefined();
            });
        });

        describe('trackEventPeopleCompleted', () => {
            it('should track participants count with max update type', async () => {
                const participantsCount = 25;

                await tracker.trackEventPeopleCompleted(mockUserId, mockEventId, participantsCount);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'EVENT_PEOPLE_COMPLETED',
                    participantsCount,
                    { updateType: 'max' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackEventPeopleCompleted(mockUserId, mockEventId, 10))
                    .resolves
                    .toBeUndefined();
            });
        });

        describe('trackEventTimeCompleted', () => {
            it('should track time completion with increment', async () => {
                const completedAt = new Date();

                await tracker.trackEventTimeCompleted(mockUserId, mockEventId, completedAt);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'EVENT_TIME_COMPLETED',
                    1,
                    { updateType: 'increment' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackEventTimeCompleted(mockUserId, mockEventId, new Date()))
                    .resolves
                    .toBeUndefined();
            });
        });

        describe('trackEventIncomeOnetime', () => {
            it('should track one-time income with max update type', async () => {
                const income = 2500;

                await tracker.trackEventIncomeOnetime(mockUserId, mockEventId, income);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'EVENT_INCOME_ONETIME',
                    income,
                    { updateType: 'max' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackEventIncomeOnetime(mockUserId, mockEventId, 1000))
                    .resolves
                    .toBeUndefined();
            });
        });

        describe('trackEventIncomeAll', () => {
            it('should track total income with increment', async () => {
                const income = 1500;

                await tracker.trackEventIncomeAll(mockUserId, income);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'EVENT_INCOME_ALL',
                    income,
                    { updateType: 'increment' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackEventIncomeAll(mockUserId, 500))
                    .resolves
                    .toBeUndefined();
            });
        });

        describe('trackEventCountAll', () => {
            it('should track event count with increment', async () => {
                await tracker.trackEventCountAll(mockUserId);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'EVENT_COUNT_ALL',
                    1,
                    { updateType: 'increment' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackEventCountAll(mockUserId))
                    .resolves
                    .toBeUndefined();
            });
        });

        describe('trackEventCountCreated', () => {
            it('should track created events count with increment', async () => {
                await tracker.trackEventCountCreated(mockUserId);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'EVENT_COUNT_CREATED',
                    1,
                    { updateType: 'increment' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackEventCountCreated(mockUserId))
                    .resolves
                    .toBeUndefined();
            });
        });

        describe('trackEventCountCompleted', () => {
            it('should track completed events count with increment', async () => {
                await tracker.trackEventCountCompleted(mockUserId);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'EVENT_COUNT_COMPLETED',
                    1,
                    { updateType: 'increment' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackEventCountCompleted(mockUserId))
                    .resolves
                    .toBeUndefined();
            });
        });
    });

    describe('UserCriterionTracker', () => {
        let tracker;

        beforeEach(() => {
            tracker = new UserCriterionTracker();
        });

        describe('trackUserActivity', () => {
            it('should track user activity streak with max update type', async () => {
                const streakDays = 7;

                await tracker.trackUserActivity(mockUserId, streakDays);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'USER_ACTIVITY',
                    streakDays,
                    { updateType: 'max' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackUserActivity(mockUserId, 5))
                    .resolves
                    .toBeUndefined();
            });
        });

        describe('trackUserBank', () => {
            it('should track user bank with set update type', async () => {
                const bankAmount = 15000;

                await tracker.trackUserBank(mockUserId, bankAmount);

                expect(mockAchievementTracker.updateProgress).toHaveBeenCalledWith(
                    mockUserId,
                    'USER_BANK',
                    bankAmount,
                    { updateType: 'set' }
                );
            });

            it('should handle errors gracefully', async () => {
                const error = new Error('Update failed');
                mockAchievementTracker.updateProgress.mockRejectedValue(error);

                await expect(tracker.trackUserBank(mockUserId, 5000))
                    .resolves
                    .toBeUndefined();
            });
        });
    });

    describe('CriterionManager', () => {
        let manager;

        beforeEach(() => {
            manager = new CriterionManager();
        });

        describe('initialization methods', () => {
            it('should initialize user achievements', async () => {
                await manager.initializeUser(mockUserId);

                expect(mockAchievementTracker.initializeUserAchievements).toHaveBeenCalledWith(mockUserId);
            });

            it('should get user achievements', async () => {
                const mockAchievements = [{ id: 1, status: true }];
                mockAchievementTracker.getUserAchievements.mockResolvedValue(mockAchievements);

                const result = await manager.getUserAchievements(mockUserId);

                expect(mockAchievementTracker.getUserAchievements).toHaveBeenCalledWith(mockUserId);
                expect(result).toEqual(mockAchievements);
            });
        });

        describe('onEventCompleted', () => {
            it('should track all event completion criteria', async () => {
                const eventData = {
                    bankAmount: 5000,
                    participantsCount: 20,
                    completedAt: new Date(),
                    userIncome: 2500
                };

                // Spy on tracker methods
                const eventTrackerSpy = jest.spyOn(manager.eventTracker, 'trackEventBankCompleted');
                const peopleTrackerSpy = jest.spyOn(manager.eventTracker, 'trackEventPeopleCompleted');
                const timeTrackerSpy = jest.spyOn(manager.eventTracker, 'trackEventTimeCompleted');
                const incomeOnetimeSpy = jest.spyOn(manager.eventTracker, 'trackEventIncomeOnetime');
                const incomeAllSpy = jest.spyOn(manager.eventTracker, 'trackEventIncomeAll');
                const countCompletedSpy = jest.spyOn(manager.eventTracker, 'trackEventCountCompleted');
                const countAllSpy = jest.spyOn(manager.eventTracker, 'trackEventCountAll');

                await manager.onEventCompleted(mockUserId, mockEventId, eventData);

                expect(eventTrackerSpy).toHaveBeenCalledWith(mockUserId, mockEventId, eventData.bankAmount);
                expect(peopleTrackerSpy).toHaveBeenCalledWith(mockUserId, mockEventId, eventData.participantsCount);
                expect(timeTrackerSpy).toHaveBeenCalledWith(mockUserId, mockEventId, eventData.completedAt);
                expect(incomeOnetimeSpy).toHaveBeenCalledWith(mockUserId, mockEventId, eventData.userIncome);
                expect(incomeAllSpy).toHaveBeenCalledWith(mockUserId, eventData.userIncome);
                expect(countCompletedSpy).toHaveBeenCalledWith(mockUserId);
                expect(countAllSpy).toHaveBeenCalledWith(mockUserId);
            });

            it('should skip tracking criteria when data is missing', async () => {
                const eventData = {
                    // Missing bankAmount, participantsCount, etc.
                    userIncome: 0,
                    completedAt: null
                };

                const bankTrackerSpy = jest.spyOn(manager.eventTracker, 'trackEventBankCompleted');
                const peopleTrackerSpy = jest.spyOn(manager.eventTracker, 'trackEventPeopleCompleted');
                const timeTrackerSpy = jest.spyOn(manager.eventTracker, 'trackEventTimeCompleted');
                const incomeOnetimeSpy = jest.spyOn(manager.eventTracker, 'trackEventIncomeOnetime');
                const incomeAllSpy = jest.spyOn(manager.eventTracker, 'trackEventIncomeAll');

                await manager.onEventCompleted(mockUserId, mockEventId, eventData);

                expect(bankTrackerSpy).not.toHaveBeenCalled();
                expect(peopleTrackerSpy).not.toHaveBeenCalled();
                expect(timeTrackerSpy).not.toHaveBeenCalled();
                expect(incomeOnetimeSpy).not.toHaveBeenCalled();
                expect(incomeAllSpy).not.toHaveBeenCalled();
            });

            it('should track income when userIncome is positive', async () => {
                const eventData = {
                    userIncome: 1500
                };

                const incomeOnetimeSpy = jest.spyOn(manager.eventTracker, 'trackEventIncomeOnetime');
                const incomeAllSpy = jest.spyOn(manager.eventTracker, 'trackEventIncomeAll');

                await manager.onEventCompleted(mockUserId, mockEventId, eventData);

                expect(incomeOnetimeSpy).toHaveBeenCalledWith(mockUserId, mockEventId, 1500);
                expect(incomeAllSpy).toHaveBeenCalledWith(mockUserId, 1500);
            });
        });

        describe('onEventCreated', () => {
            it('should track event creation criteria', async () => {
                const createdSpy = jest.spyOn(manager.eventTracker, 'trackEventCountCreated');
                const allSpy = jest.spyOn(manager.eventTracker, 'trackEventCountAll');

                await manager.onEventCreated(mockUserId, mockEventId);

                expect(createdSpy).toHaveBeenCalledWith(mockUserId);
                expect(allSpy).toHaveBeenCalledWith(mockUserId);
            });
        });

        describe('onEventParticipated', () => {
            it('should track event participation criteria', async () => {
                const participatedSpy = jest.spyOn(manager.eventTracker, 'trackEventCountAll');

                await manager.onEventParticipated(mockUserId, mockEventId);

                expect(participatedSpy).toHaveBeenCalledWith(mockUserId);
            });
        });

        describe('onUserActivityUpdated', () => {
            it('should track user activity criteria', async () => {
                const streakDays = 14;
                const activitySpy = jest.spyOn(manager.userTracker, 'trackUserActivity');

                await manager.onUserActivityUpdated(mockUserId, streakDays);

                expect(activitySpy).toHaveBeenCalledWith(mockUserId, streakDays);
            });
        });

        describe('onUserBankUpdated', () => {
            it('should track user bank criteria', async () => {
                const bankAmount = 25000;
                const bankSpy = jest.spyOn(manager.userTracker, 'trackUserBank');

                await manager.onUserBankUpdated(mockUserId, bankAmount);

                expect(bankSpy).toHaveBeenCalledWith(mockUserId, bankAmount);
            });
        });
    });

    describe('Error handling', () => {
        it('should propagate errors from internal trackers', async () => {
            const manager = new CriterionManager();
            const error = new Error('Tracker error');
            
            jest.spyOn(manager.eventTracker, 'trackEventCountCreated').mockRejectedValue(error);

            // Should propagate errors from internal trackers
            await expect(manager.onEventCreated(mockUserId, mockEventId))
                .rejects
                .toThrow('Tracker error');
        });

        it('should handle errors in achievement tracker initialization', async () => {
            const manager = new CriterionManager();
            const error = new Error('Initialization failed');
            
            mockAchievementTracker.initializeUserAchievements.mockRejectedValue(error);

            await expect(manager.initializeUser(mockUserId))
                .rejects
                .toThrow('Initialization failed');
        });
    });

    describe('Integration between trackers', () => {
        it('should use the same achievement tracker instance across different criterion trackers', () => {
            const eventTracker = new EventCriterionTracker();
            const userTracker = new UserCriterionTracker();

            // Both should have called AchievementTracker constructor
            expect(AchievementTracker).toHaveBeenCalledTimes(2);
        });

        it('should correctly instantiate CriterionManager with all trackers', () => {
            const manager = new CriterionManager();

            expect(manager.eventTracker).toBeInstanceOf(EventCriterionTracker);
            expect(manager.userTracker).toBeInstanceOf(UserCriterionTracker);
            expect(manager.achievementTracker).toBeDefined();
        });
    });
}); 