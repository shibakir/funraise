const UserAchievementService = require('../../service/UserAchievementService');
const { UserAchievementRepository, UserRepository, AchievementRepository } = require('../../repository');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../repository');

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

            UserRepository.findByPk.mockResolvedValue(mockUser);
            AchievementRepository.findByPk.mockResolvedValue(mockAchievement);
            // Mock the findByUserAndAchievement method that's called inside create
            const findByUserAndAchievementSpy = jest.spyOn(UserAchievementService, 'findByUserAndAchievement')
                .mockResolvedValue(null);
            UserAchievementRepository.create.mockResolvedValue(mockUserAchievement);

            const result = await UserAchievementService.create(validUserAchievementData);

            expect(UserRepository.findByPk).toHaveBeenCalledWith(1);
            expect(AchievementRepository.findByPk).toHaveBeenCalledWith(1);
            expect(UserAchievementRepository.create).toHaveBeenCalledWith({
                userId: 1,
                achievementId: 1
            });
            expect(result).toEqual(mockUserAchievement);

            findByUserAndAchievementSpy.mockRestore();
        });

        it('should throw an error if user does not exist', async () => {
            UserRepository.findByPk.mockResolvedValueOnce(null);

            const promise = UserAchievementService.create(validUserAchievementData);

            await expect(promise).rejects.toThrow(ApiError);
            await expect(promise).rejects.toHaveProperty('message', 'User does not exist');
            await expect(promise).rejects.toHaveProperty('status', 404);
        });

        it('should throw an error if achievement does not exist', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            
            UserRepository.findByPk.mockResolvedValueOnce(mockUser);
            AchievementRepository.findByPk.mockResolvedValueOnce(null);

            const promise = UserAchievementService.create(validUserAchievementData);

            await expect(promise).rejects.toThrow(ApiError);
            await expect(promise).rejects.toHaveProperty('message', 'Achievement does not exist');
            await expect(promise).rejects.toHaveProperty('status', 404);
        });

        it('should throw an error if the user already has this achievement', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockAchievement = { id: 1, name: 'Test Achievement' };
            const existingUserAchievement = { id: 1, userId: 1, achievementId: 1 };

            UserRepository.findByPk.mockResolvedValue(mockUser);
            AchievementRepository.findByPk.mockResolvedValue(mockAchievement);
            // Mock the findByUserAndAchievement method to return existing achievement
            const findByUserAndAchievementSpy = jest.spyOn(UserAchievementService, 'findByUserAndAchievement')
                .mockResolvedValue(existingUserAchievement);

            const promise = UserAchievementService.create(validUserAchievementData);

            await expect(promise).rejects.toThrow(ApiError);
            await expect(promise).rejects.toHaveProperty('message', 'User already has this achievement');
            await expect(promise).rejects.toHaveProperty('status', 409);

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

            UserAchievementRepository.findByUserAndAchievement.mockResolvedValue(mockUserAchievement);

            const result = await UserAchievementService.findByUserAndAchievement(1, 1);

            expect(UserAchievementRepository.findByUserAndAchievement).toHaveBeenCalledWith(1, 1);
            expect(result).toEqual(mockUserAchievement);
        });

        it('should return null if the achievement is not found', async () => {
            UserAchievementRepository.findByUserAndAchievement.mockResolvedValue(null);

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

            UserAchievementRepository.findByPk.mockResolvedValue(mockUserAchievement);

            const result = await UserAchievementService.findById(1);

            expect(UserAchievementRepository.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockUserAchievement);
        });

        it('should throw an error if the achievement is not found', async () => {
            const notFoundError = ApiError.notFound('UserAchievement not found');
            UserAchievementRepository.findByPk.mockRejectedValue(notFoundError);

            const promise = UserAchievementService.findById(999);

            await expect(promise).rejects.toThrow(ApiError);
            await expect(promise).rejects.toHaveProperty('message', 'UserAchievement not found');
            await expect(promise).rejects.toHaveProperty('status', 404);
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

            UserAchievementRepository.findByUserWithDetails.mockResolvedValue(mockUserAchievements);

            const result = await UserAchievementService.findByUserWithDetails(1);

            expect(UserAchievementRepository.findByUserWithDetails).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockUserAchievements);
        });

        it('should return an empty array if the user has no achievements', async () => {
            UserAchievementRepository.findByUserWithDetails.mockResolvedValue([]);

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

            const mockUpdatedResult = {
                id: 1,
                status: 'COMPLETED',
                unlockedAt: expect.any(Date)
            };

            // Mock findById method that's called inside updateStatus
            const findByIdSpy = jest.spyOn(UserAchievementService, 'findById')
                .mockResolvedValue(mockUserAchievement);
            UserAchievementRepository.updateStatus.mockResolvedValue(mockUpdatedResult);

            const result = await UserAchievementService.updateStatus(1, 'COMPLETED', new Date());

            expect(UserAchievementRepository.updateStatus).toHaveBeenCalledWith(1, 'COMPLETED', expect.any(Date));
            expect(result).toEqual(mockUpdatedResult);

            findByIdSpy.mockRestore();
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

            const promise = UserAchievementService.updateStatus(1, 'COMPLETED');

            await expect(promise).rejects.toThrow(ApiError);
            await expect(promise).rejects.toHaveProperty('message', 'Achievement status is already set to this value');

            findByIdSpy.mockRestore();
        });

        it('should update the status without specifying the unlock time', async () => {
            const mockUserAchievement = {
                id: 1,
                userId: 1,
                achievementId: 1,
                status: 'IN_PROGRESS'
            };

            const mockUpdatedResult = {
                id: 1,
                status: 'FAILED',
                unlockedAt: null
            };

            // Mock findById method that's called inside updateStatus
            const findByIdSpy = jest.spyOn(UserAchievementService, 'findById')
                .mockResolvedValue(mockUserAchievement);
            UserAchievementRepository.updateStatus.mockResolvedValue(mockUpdatedResult);

            const result = await UserAchievementService.updateStatus(1, 'FAILED');

            expect(UserAchievementRepository.updateStatus).toHaveBeenCalledWith(1, 'FAILED', null);
            expect(result).toEqual(mockUpdatedResult);

            findByIdSpy.mockRestore();
        });
    });

    describe('error handling', () => {
        it('should handle database errors when creating', async () => {
            const dbError = new Error('Database constraint violation');
            
            UserRepository.findByPk.mockResolvedValue({ id: 1, username: 'testuser' });
            AchievementRepository.findByPk.mockResolvedValue({ id: 1, name: 'Test Achievement' });
            UserAchievementService.findByUserAndAchievement = jest.fn().mockResolvedValue(null);
            UserAchievementRepository.create.mockRejectedValue(dbError);

            await expect(UserAchievementService.create({
                userId: 1,
                achievementId: 1
            })).rejects.toThrow('Error creating user achievement');
        });

        it('should handle database errors when finding with details', async () => {
            const dbError = new Error('Database connection error');
            UserAchievementRepository.findByUserWithDetails.mockRejectedValue(dbError);

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
            UserRepository.findByPk.mockResolvedValueOnce({ id: 1, username: 'testuser' });
            AchievementRepository.findByPk.mockResolvedValueOnce(null);
            const findByUserAndAchievementSpy1 = jest.spyOn(UserAchievementService, 'findByUserAndAchievement')
                .mockResolvedValue(null);

            await expect(UserAchievementService.create(userData))
                .rejects
                .toThrow(ApiError);

            findByUserAndAchievementSpy1.mockRestore();

            // Test case 2: User does not exist (achievement check won't be reached)
            UserRepository.findByPk.mockResolvedValueOnce(null);
            AchievementRepository.findByPk.mockResolvedValueOnce({ id: 1, name: 'Test Achievement' }); // This won't be reached
            const findByUserAndAchievementSpy2 = jest.spyOn(UserAchievementService, 'findByUserAndAchievement')
                .mockResolvedValue(null);

            await expect(UserAchievementService.create(userData))
                .rejects
                .toThrow(ApiError);

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

                const mockUpdatedResult = {
                    id: 1,
                    status: status,
                    unlockedAt: null
                };

                // Mock the findById method that's called inside updateStatus
                const findByIdSpy = jest.spyOn(UserAchievementService, 'findById')
                    .mockResolvedValue(mockUserAchievement);
                UserAchievementRepository.updateStatus.mockResolvedValue(mockUpdatedResult);

                const result = await UserAchievementService.updateStatus(1, status);
                expect(result).toEqual(mockUpdatedResult);

                findByIdSpy.mockRestore();
            }
        });
    });
}); 