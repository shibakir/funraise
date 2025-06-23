const AchievementTracker = require('../../../utils/achievement/AchievementTracker');

// Mock dependencies
jest.mock('../../../service/AchievementService');
jest.mock('../../../service/UserAchievementService');
jest.mock('../../../service/UserCriterionProgressService');
jest.mock('../../../service/AchievementCriterionService');

const achievementService = require('../../../service/AchievementService');
const userAchievementService = require('../../../service/UserAchievementService');
const userCriterionProgressService = require('../../../service/UserCriterionProgressService');
const achievementCriterionService = require('../../../service/AchievementCriterionService');

describe('AchievementTracker', () => {
    let tracker;
    const mockUserId = 123;

    beforeEach(() => {
        jest.clearAllMocks();
        tracker = new AchievementTracker();
        
        // Mock console methods to avoid noise in test output
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('initializeUserAchievements', () => {
        const mockAchievements = [
            {
                id: 1,
                name: 'First Achievement',
                criteria: [
                    { id: 1, type: 'EVENT_COUNT', value: 5 },
                    { id: 2, type: 'BANK_AMOUNT', value: 1000 }
                ]
            },
            {
                id: 2,
                name: 'Second Achievement',
                criteria: [
                    { id: 3, type: 'PARTICIPATION_COUNT', value: 10 }
                ]
            }
        ];

        it('should successfully initialize achievements for a new user', async () => {
            // Setup mocks
            achievementService.getAllWithCriteria.mockResolvedValue(mockAchievements);
            userAchievementService.findByUserAndAchievement.mockResolvedValue(null);
            userAchievementService.create.mockResolvedValueOnce({ id: 1 })
                                                .mockResolvedValueOnce({ id: 2 });
            userCriterionProgressService.findByUserAchievementAndCriterion.mockResolvedValue(null);
            userCriterionProgressService.createProgress.mockResolvedValue({ id: 1 });

            // Execute
            await tracker.initializeUserAchievements(mockUserId);

            // Verify
            expect(achievementService.getAllWithCriteria).toHaveBeenCalledTimes(1);
            expect(userAchievementService.findByUserAndAchievement).toHaveBeenCalledTimes(2);
            expect(userAchievementService.create).toHaveBeenCalledTimes(2);
            expect(userCriterionProgressService.createProgress).toHaveBeenCalledTimes(3);
        });

        it('should skip creating user achievement if it already exists', async () => {
            const existingUserAchievement = { id: 1, userId: mockUserId, achievementId: 1 };
            
            achievementService.getAllWithCriteria.mockResolvedValue([mockAchievements[0]]);
            userAchievementService.findByUserAndAchievement.mockResolvedValue(existingUserAchievement);
            userCriterionProgressService.findByUserAchievementAndCriterion.mockResolvedValue(null);
            userCriterionProgressService.createProgress.mockResolvedValue({ id: 1 });

            await tracker.initializeUserAchievements(mockUserId);

            expect(userAchievementService.create).not.toHaveBeenCalled();
            expect(userCriterionProgressService.createProgress).toHaveBeenCalledTimes(2);
        });

        it('should skip creating criterion progress if it already exists', async () => {
            const existingProgress = { id: 1, currentValue: 0, completed: false };
            
            achievementService.getAllWithCriteria.mockResolvedValue([mockAchievements[0]]);
            userAchievementService.findByUserAndAchievement.mockResolvedValue(null);
            userAchievementService.create.mockResolvedValue({ id: 1 });
            userCriterionProgressService.findByUserAchievementAndCriterion.mockResolvedValue(existingProgress);

            await tracker.initializeUserAchievements(mockUserId);

            expect(userCriterionProgressService.createProgress).not.toHaveBeenCalled();
        });

        it('should handle errors during initialization', async () => {
            const dbError = new Error('Database connection failed');
            achievementService.getAllWithCriteria.mockRejectedValue(dbError);

            await expect(tracker.initializeUserAchievements(mockUserId))
                .rejects
                .toThrow('Database connection failed');
        });
    });

    describe('updateProgress', () => {
        const mockCriteria = [
            { id: 1, type: 'EVENT_COUNT', value: 5, achievementId: 1 },
            { id: 2, type: 'EVENT_COUNT', value: 10, achievementId: 2 }
        ];
        
        const mockUserAchievement = { id: 1, userId: mockUserId, achievementId: 1, status: false };
        const mockProgress = { id: 1, currentValue: 2, completed: false };

        beforeEach(() => {
            achievementCriterionService.findByType.mockResolvedValue(mockCriteria);
            userAchievementService.findByUserAndAchievement.mockResolvedValue(mockUserAchievement);
            userCriterionProgressService.findByUserAchievementAndCriterion.mockResolvedValue(mockProgress);
            userCriterionProgressService.updateProgress.mockResolvedValue();
            tracker.checkAchievementCompletion = jest.fn().mockResolvedValue();
        });

        it('should increment progress by default', async () => {
            await tracker.updateProgress(mockUserId, 'EVENT_COUNT', 1);

            expect(userCriterionProgressService.updateProgress).toHaveBeenCalledWith(
                mockProgress.id,
                3, // 2 + 1
                false,
                null
            );
        });

        it('should set progress when updateType is "set"', async () => {
            await tracker.updateProgress(mockUserId, 'EVENT_COUNT', 7, { updateType: 'set' });

            expect(userCriterionProgressService.updateProgress).toHaveBeenCalledWith(
                mockProgress.id,
                7,
                true, // 7 >= 5
                expect.any(Date)
            );
        });

        it('should use max value when updateType is "max"', async () => {
            await tracker.updateProgress(mockUserId, 'EVENT_COUNT', 1, { updateType: 'max' });

            expect(userCriterionProgressService.updateProgress).toHaveBeenCalledWith(
                mockProgress.id,
                2, // max(2, 1) = 2
                false,
                null
            );
        });

        it('should complete criterion and check achievement when target is reached', async () => {
            await tracker.updateProgress(mockUserId, 'EVENT_COUNT', 3);

            expect(userCriterionProgressService.updateProgress).toHaveBeenCalledWith(
                mockProgress.id,
                5, // 2 + 3 = 5 (equals target)
                true,
                expect.any(Date)
            );
            expect(tracker.checkAchievementCompletion).toHaveBeenCalledWith(mockUserAchievement.id);
        });

        it('should skip already completed achievements', async () => {
            const completedAchievement = { ...mockUserAchievement, status: true };
            userAchievementService.findByUserAndAchievement.mockResolvedValue(completedAchievement);

            await tracker.updateProgress(mockUserId, 'EVENT_COUNT', 1);

            expect(userCriterionProgressService.updateProgress).not.toHaveBeenCalled();
        });

        it('should skip already completed criteria', async () => {
            const completedProgress = { ...mockProgress, completed: true };
            userCriterionProgressService.findByUserAchievementAndCriterion.mockResolvedValue(completedProgress);

            await tracker.updateProgress(mockUserId, 'EVENT_COUNT', 1);

            expect(userCriterionProgressService.updateProgress).not.toHaveBeenCalled();
        });

        it('should create progress if it does not exist', async () => {
            userCriterionProgressService.findByUserAchievementAndCriterion.mockResolvedValue(null);
            const newProgress = { id: 2, currentValue: 0, completed: false };
            userCriterionProgressService.createProgress.mockResolvedValue(newProgress);

            await tracker.updateProgress(mockUserId, 'EVENT_COUNT', 1);

            expect(userCriterionProgressService.createProgress).toHaveBeenCalledWith(
                mockUserAchievement.id,
                mockCriteria[0].id,
                0,
                false
            );
            expect(userCriterionProgressService.updateProgress).toHaveBeenCalledWith(
                newProgress.id,
                1, // 0 + 1
                false,
                null
            );
        });

        it('should handle errors during progress update', async () => {
            const updateError = new Error('Update failed');
            userCriterionProgressService.updateProgress.mockRejectedValue(updateError);

            await expect(tracker.updateProgress(mockUserId, 'EVENT_COUNT', 1))
                .rejects
                .toThrow('Update failed');
        });
    });

    describe('checkAchievementCompletion', () => {
        const mockUserAchievementId = 1;
        const mockUserAchievement = { id: mockUserAchievementId, userId: mockUserId, achievementId: 1, status: false };

        beforeEach(() => {
            userAchievementService.findById.mockResolvedValue(mockUserAchievement);
            userAchievementService.updateStatus.mockResolvedValue();
            tracker.onAchievementUnlocked = jest.fn().mockResolvedValue();
        });

        it('should complete achievement when all criteria are completed', async () => {
            const completedProgress = [
                { id: 1, completed: true },
                { id: 2, completed: true }
            ];
            userCriterionProgressService.findByUserAchievement.mockResolvedValue(completedProgress);

            await tracker.checkAchievementCompletion(mockUserAchievementId);

            expect(userAchievementService.updateStatus).toHaveBeenCalledWith(
                mockUserAchievementId,
                true,
                expect.any(Date)
            );
            expect(tracker.onAchievementUnlocked).toHaveBeenCalledWith(mockUserAchievement);
        });

        it('should not complete achievement when some criteria are incomplete', async () => {
            const mixedProgress = [
                { id: 1, completed: true },
                { id: 2, completed: false }
            ];
            userCriterionProgressService.findByUserAchievement.mockResolvedValue(mixedProgress);

            await tracker.checkAchievementCompletion(mockUserAchievementId);

            expect(userAchievementService.updateStatus).not.toHaveBeenCalled();
            expect(tracker.onAchievementUnlocked).not.toHaveBeenCalled();
        });

        it('should not complete achievement if it is already completed', async () => {
            const completedAchievement = { ...mockUserAchievement, status: true };
            userAchievementService.findById.mockResolvedValue(completedAchievement);

            await tracker.checkAchievementCompletion(mockUserAchievementId);

            expect(userCriterionProgressService.findByUserAchievement).not.toHaveBeenCalled();
        });

        it('should not complete achievement if no progress records exist', async () => {
            userCriterionProgressService.findByUserAchievement.mockResolvedValue([]);

            await tracker.checkAchievementCompletion(mockUserAchievementId);

            expect(userAchievementService.updateStatus).not.toHaveBeenCalled();
        });

        it('should handle errors during achievement completion check', async () => {
            const checkError = new Error('Check failed');
            userCriterionProgressService.findByUserAchievement.mockRejectedValue(checkError);

            await expect(tracker.checkAchievementCompletion(mockUserAchievementId))
                .rejects
                .toThrow('Check failed');
        });
    });

    describe('getUserAchievements', () => {
        const mockUserAchievements = [
            { id: 1, achievementId: 1, status: true },
            { id: 2, achievementId: 2, status: false }
        ];

        it('should return user achievements with details', async () => {
            userAchievementService.findByUserWithDetails.mockResolvedValue(mockUserAchievements);

            const result = await tracker.getUserAchievements(mockUserId);

            expect(userAchievementService.findByUserWithDetails).toHaveBeenCalledWith(mockUserId);
            expect(result).toEqual(mockUserAchievements);
        });

        it('should handle errors when getting user achievements', async () => {
            const getError = new Error('Get failed');
            userAchievementService.findByUserWithDetails.mockRejectedValue(getError);

            await expect(tracker.getUserAchievements(mockUserId))
                .rejects
                .toThrow('Get failed');
        });
    });

    describe('onAchievementUnlocked', () => {
        it('should handle achievement unlock event', async () => {
            const userAchievement = { userId: mockUserId, achievementId: 1 };

            // This method currently just logs, so we test that it doesn't throw
            await expect(tracker.onAchievementUnlocked(userAchievement))
                .resolves
                .toBeUndefined();
        });
    });
}); 