const UserAchievementService = require('../../service/UserAchievementService');
const { UserAchievement, User, Achievement, UserCriterionProgress, AchievementCriterion } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../model');

describe('UserAchievementService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validUserAchievementData = {
            userId: 1,
            achievementId: 1
        };

        it('should successfully create a user achievement', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser'
            };

            const mockAchievement = {
                id: 1,
                name: 'Test Achievement'
            };

            const mockUserAchievement = {
                id: 1,
                userId: 1,
                achievementId: 1,
                status: 'IN_PROGRESS',
                unlockedAt: null
            };

            User.findOne.mockResolvedValue(mockUser);
            Achievement.findOne.mockResolvedValue(mockAchievement);
            // Mock the findByUserAndAchievement method that's called inside create
            const findByUserAndAchievementSpy = jest.spyOn(UserAchievementService, 'findByUserAndAchievement')
                .mockResolvedValue(null);
            UserAchievement.create.mockResolvedValue(mockUserAchievement);

            const result = await UserAchievementService.create(validUserAchievementData);

            expect(User.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(Achievement.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(UserAchievement.create).toHaveBeenCalledWith({
                userId: 1,
                achievementId: 1
            });
            expect(result).toEqual(mockUserAchievement);

            findByUserAndAchievementSpy.mockRestore();
        });

        it('should validate input data', async () => {
            const invalidData = {
                userId: '', // empty userId
                achievementId: 1
            };

            await expect(UserAchievementService.create(invalidData))
                .rejects
                .toThrow('Validation failed');
        });

        it('should throw an error if the user already has this achievement', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockAchievement = { id: 1, name: 'Test Achievement' };
            const existingUserAchievement = { id: 1, userId: 1, achievementId: 1 };

            User.findOne.mockResolvedValue(mockUser);
            Achievement.findOne.mockResolvedValue(mockAchievement);
            // Mock the findByUserAndAchievement method to return existing achievement
            const findByUserAndAchievementSpy = jest.spyOn(UserAchievementService, 'findByUserAndAchievement')
                .mockResolvedValue(existingUserAchievement);

            await expect(UserAchievementService.create(validUserAchievementData))
                .rejects
                .toThrow('User already has this achievement');

            findByUserAndAchievementSpy.mockRestore();
        });
    });

    describe('findByUserAndAchievement', () => {
        it('should find a user achievement', async () => {
            const mockUserAchievement = {
                id: 1,
                userId: 1,
                achievementId: 1,
                status: 'COMPLETED'
            };

            UserAchievement.findOne.mockResolvedValue(mockUserAchievement);

            const result = await UserAchievementService.findByUserAndAchievement(1, 1);

            expect(UserAchievement.findOne).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    achievementId: 1
                }
            });
            expect(result).toEqual(mockUserAchievement);
        });

        it('should return null if the achievement is not found', async () => {
            UserAchievement.findOne.mockResolvedValue(null);

            const result = await UserAchievementService.findByUserAndAchievement(999, 999);

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should find a user achievement by ID', async () => {
            const mockUserAchievement = {
                id: 1,
                userId: 1,
                achievementId: 1,
                status: 'IN_PROGRESS'
            };

            UserAchievement.findByPk.mockResolvedValue(mockUserAchievement);

            const result = await UserAchievementService.findById(1);

            expect(UserAchievement.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockUserAchievement);
        });

        it('should throw an error if the achievement is not found', async () => {
            UserAchievement.findByPk.mockResolvedValue(null);

            await expect(UserAchievementService.findById(999))
                .rejects
                .toThrow('User achievement not found');
        });
    });

    describe('findByUserWithDetails', () => {
        it('should find all user achievements with details', async () => {
            const mockUserAchievements = [
                {
                    id: 1,
                    userId: 1,
                    achievementId: 1,
                    status: 'COMPLETED',
                    achievement: {
                        id: 1,
                        name: 'First Achievement'
                    },
                    progresses: [
                        {
                            id: 1,
                            currentValue: 5,
                            completed: true,
                            criterion: {
                                id: 1,
                                type: 'EVENT_COUNT',
                                value: 5
                            }
                        }
                    ]
                },
                {
                    id: 2,
                    userId: 1,
                    achievementId: 2,
                    status: 'IN_PROGRESS',
                    achievement: {
                        id: 2,
                        name: 'Second Achievement'
                    },
                    progresses: [
                        {
                            id: 2,
                            currentValue: 3,
                            completed: false,
                            criterion: {
                                id: 2,
                                type: 'BANK_AMOUNT',
                                value: 1000
                            }
                        }
                    ]
                }
            ];

            UserAchievement.findAll.mockResolvedValue(mockUserAchievements);

            const result = await UserAchievementService.findByUserWithDetails(1);

            expect(UserAchievement.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                include: [
                    {
                        model: Achievement,
                        as: 'achievement'
                    },
                    {
                        model: UserCriterionProgress,
                        as: 'progresses',
                        include: [{
                            model: AchievementCriterion,
                            as: 'criterion'
                        }]
                    }
                ]
            });
            expect(result).toEqual(mockUserAchievements);
        });

        it('should return an empty array if the user has no achievements', async () => {
            UserAchievement.findAll.mockResolvedValue([]);

            const result = await UserAchievementService.findByUserWithDetails(999);

            expect(result).toEqual([]);
        });
    });

    describe('updateStatus', () => {
        it('should successfully update the achievement status', async () => {
            const mockUserAchievement = {
                id: 1,
                userId: 1,
                achievementId: 1,
                status: 'IN_PROGRESS'
            };

            UserAchievement.findByPk.mockResolvedValue(mockUserAchievement);
            UserAchievement.update.mockResolvedValue([1]);

            const result = await UserAchievementService.updateStatus(1, 'COMPLETED', new Date());

            expect(UserAchievement.findByPk).toHaveBeenCalledWith(1);
            expect(UserAchievement.update).toHaveBeenCalledWith(
                { 
                    status: 'COMPLETED',
                    unlockedAt: expect.any(Date)
                },
                { where: { id: 1 } }
            );
            expect(result).toEqual([1]);
        });

        it('should throw an error if the status is already set', async () => {
            const mockUserAchievement = {
                id: 1,
                userId: 1,
                achievementId: 1,
                status: 'COMPLETED'
            };

            // Mock findById method that's called inside updateStatus
            const findByIdSpy = jest.spyOn(UserAchievementService, 'findById')
                .mockResolvedValue(mockUserAchievement);

            await expect(UserAchievementService.updateStatus(1, 'COMPLETED'))
                .rejects
                .toThrow('Achievement status is already set to this value');

            findByIdSpy.mockRestore();
        });

        it('should update the status without specifying the unlock time', async () => {
            const mockUserAchievement = {
                id: 1,
                userId: 1,
                achievementId: 1,
                status: 'IN_PROGRESS'
            };

            UserAchievement.findByPk.mockResolvedValue(mockUserAchievement);
            UserAchievement.update.mockResolvedValue([1]);

            const result = await UserAchievementService.updateStatus(1, 'FAILED');

            expect(UserAchievement.update).toHaveBeenCalledWith(
                { 
                    status: 'FAILED',
                    unlockedAt: null
                },
                { where: { id: 1 } }
            );
            expect(result).toEqual([1]);
        });
    });

    describe('error handling', () => {
        it('should handle database errors when creating', async () => {
            const dbError = new Error('Database constraint violation');
            
            User.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
            Achievement.findOne.mockResolvedValue({ id: 1, name: 'Test Achievement' });
            UserAchievementService.findByUserAndAchievement = jest.fn().mockResolvedValue(null);
            UserAchievement.create.mockRejectedValue(dbError);

            await expect(UserAchievementService.create({
                userId: 1,
                achievementId: 1
            })).rejects.toThrow('Error creating user achievement');
        });

        it('should handle database errors when finding with details', async () => {
            const dbError = new Error('Database connection error');
            UserAchievement.findAll.mockRejectedValue(dbError);

            await expect(UserAchievementService.findByUserWithDetails(1))
                .rejects
                .toThrow('Error getting user achievements with details');
        });

        it('should handle database errors when updating the status', async () => {
            const dbError = new Error('Database error');
            // Mock findById method that's called inside updateStatus
            const findByIdSpy = jest.spyOn(UserAchievementService, 'findById')
                .mockRejectedValue(dbError);

            await expect(UserAchievementService.updateStatus(1, 'COMPLETED'))
                .rejects
                .toThrow('Error updating user achievement status');

            findByIdSpy.mockRestore();
        });
    });

    describe('business logic', () => {
        it('should correctly check the existence of a user and achievement', async () => {
            const userData = { userId: 1, achievementId: 1 };
            
            // Test case 1: User exists, achievement does not exist
            User.findOne.mockResolvedValueOnce({ id: 1, username: 'testuser' });
            Achievement.findOne.mockResolvedValueOnce(null);
            const findByUserAndAchievementSpy1 = jest.spyOn(UserAchievementService, 'findByUserAndAchievement')
                .mockResolvedValue(null);

            await expect(UserAchievementService.create(userData))
                .rejects
                .toThrow('Achievement does not exist');

            findByUserAndAchievementSpy1.mockRestore();

            // Test case 2: User does not exist (achievement check won't be reached)
            User.findOne.mockResolvedValueOnce(null);
            Achievement.findOne.mockResolvedValueOnce({ id: 1, name: 'Test Achievement' }); // This won't be reached
            const findByUserAndAchievementSpy2 = jest.spyOn(UserAchievementService, 'findByUserAndAchievement')
                .mockResolvedValue(null);

            await expect(UserAchievementService.create(userData))
                .rejects
                .toThrow('User does not exist');

            findByUserAndAchievementSpy2.mockRestore();
        });

        it('should correctly handle different achievement statuses', async () => {
            const statuses = ['COMPLETED', 'FAILED']; // Only test different statuses from IN_PROGRESS
            
            for (const status of statuses) {
                const mockUserAchievement = {
                    id: 1,
                    userId: 1,
                    achievementId: 1,
                    status: 'IN_PROGRESS' // Different from target status
                };

                // Mock the findById method that's called inside updateStatus
                const findByIdSpy = jest.spyOn(UserAchievementService, 'findById')
                    .mockResolvedValue(mockUserAchievement);
                UserAchievement.update.mockResolvedValue([1]);

                const result = await UserAchievementService.updateStatus(1, status);
                expect(result).toEqual([1]);

                findByIdSpy.mockRestore();
            }
        });
    });
}); 