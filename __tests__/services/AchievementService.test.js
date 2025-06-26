// Mock dependencies
jest.mock('../../repository', () => ({
    AchievementRepository: {
        create: jest.fn(),
        findAllWithCriteria: jest.fn(),
        findByPk: jest.fn()
    }
}));

const AchievementService = require('../../service/AchievementService');
const { AchievementRepository } = require('../../repository');
const ApiError = require('../../exception/ApiError');

describe('AchievementService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validAchievementData = {
            name: 'Test Achievement',
            iconUrl: 'https://example.com/icon.png',
            conditions: [
                { type: 'EVENT_COUNT', value: 5 },
                { type: 'BANK_AMOUNT', value: 1000 }
            ]
        };

        it('should successfully create an achievement', async () => {
            const mockAchievement = {
                id: 1,
                name: validAchievementData.name,
                iconUrl: validAchievementData.iconUrl
            };

            AchievementRepository.create.mockResolvedValue(mockAchievement);

            const result = await AchievementService.create(validAchievementData);

            expect(AchievementRepository.create).toHaveBeenCalledWith({
                name: validAchievementData.name,
                iconUrl: validAchievementData.iconUrl
            });
            expect(result).toEqual(mockAchievement);
        });

        it('should throw a validation error if the data is invalid', async () => {
            const invalidData = {
                name: '', // empty name
                iconUrl: 'invalid-url',
                conditions: []
            };

            await expect(AchievementService.create(invalidData))
                .rejects
                .toThrow('At least one condition is required');
        });

        it('should throw an error if there are no conditions', async () => {
            const dataWithoutConditions = {
                name: 'Test Achievement',
                iconUrl: 'https://example.com/icon.png',
                conditions: []
            };

            await expect(AchievementService.create(dataWithoutConditions))
                .rejects
                .toThrow('At least one condition is required');
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database constraint violation');
            AchievementRepository.create.mockRejectedValue(dbError);

            await expect(AchievementService.create(validAchievementData))
                .rejects
                .toThrow('Error creating achievement');
        });
    });

    describe('getAllWithCriteria', () => {
        it('should get all achievements with criteria', async () => {
            const mockAchievements = [
                {
                    id: 1,
                    name: 'Achievement 1',
                    iconUrl: 'https://example.com/icon1.png',
                    criteria: [
                        { id: 1, type: 'EVENT_COUNT', value: 5 },
                        { id: 2, type: 'BANK_AMOUNT', value: 1000 }
                    ]
                },
                {
                    id: 2,
                    name: 'Achievement 2',
                    iconUrl: 'https://example.com/icon2.png',
                    criteria: [
                        { id: 3, type: 'PARTICIPATION_COUNT', value: 10 }
                    ]
                }
            ];

            AchievementRepository.findAllWithCriteria.mockResolvedValue(mockAchievements);

            const result = await AchievementService.getAllWithCriteria();

            expect(AchievementRepository.findAllWithCriteria).toHaveBeenCalled();
            expect(result).toEqual(mockAchievements);
        });

        it('should handle database errors when getting achievements', async () => {
            const dbError = new Error('Database connection error');
            AchievementRepository.findAllWithCriteria.mockRejectedValue(dbError);

            await expect(AchievementService.getAllWithCriteria())
                .rejects
                .toThrow('Error getting achievements with criteria');
        });
    });

    describe('findById', () => {
        it('should find an achievement by ID', async () => {
            const mockAchievement = {
                id: 1,
                name: 'Test Achievement',
                iconUrl: 'https://example.com/icon.png'
            };

            AchievementRepository.findByPk.mockResolvedValue(mockAchievement);

            const result = await AchievementService.findById(1);

            expect(AchievementRepository.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockAchievement);
        });

        it('should handle database errors when finding by ID', async () => {
            const dbError = new Error('Database connection error');
            AchievementRepository.findByPk.mockRejectedValue(dbError);

            await expect(AchievementService.findById(1))
                .rejects
                .toThrow('Error finding achievement by ID');
        });
    });

    describe('error handling', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should correctly handle database errors', async () => {
            const dbError = new Error('Database error');
            AchievementRepository.create.mockRejectedValue(dbError);

            await expect(AchievementService.create({
                name: 'Test Achievement',
                iconUrl: 'https://example.com/icon.png',
                conditions: [{ type: 'EVENT_COUNT', value: 5 }]
            })).rejects.toThrow('Error creating achievement');
        });

        it('should correctly handle ApiError', async () => {
            await expect(AchievementService.create({
                name: '',
                iconUrl: 'https://example.com/icon.png',
                conditions: [{ type: 'EVENT_COUNT', value: 5 }]
            })).rejects.toThrow('Error creating achievement');
        });
    });

    describe('business logic validation', () => {
        it('should validate business logic for achievement conditions', async () => {
            const achievementWithEmptyConditions = {
                name: 'Test Achievement',
                iconUrl: 'https://example.com/icon.png',
                conditions: []
            };

            await expect(AchievementService.create(achievementWithEmptyConditions))
                .rejects
                .toThrow('At least one condition is required');
        });

        it('should accept different condition types', async () => {
            const achievementWithMultipleConditions = {
                name: 'Multi-Condition Achievement',
                iconUrl: 'https://example.com/icon.png',
                conditions: [
                    { type: 'EVENT_COUNT', value: 5 },
                    { type: 'BANK_AMOUNT', value: 1000 },
                    { type: 'PARTICIPATION_COUNT', value: 10 },
                    { type: 'DONATION_AMOUNT', value: 500 }
                ]
            };

            const mockAchievement = {
                id: 1,
                name: achievementWithMultipleConditions.name,
                iconUrl: achievementWithMultipleConditions.iconUrl
            };

            AchievementRepository.create.mockResolvedValue(mockAchievement);

            const result = await AchievementService.create(achievementWithMultipleConditions);

            expect(AchievementRepository.create).toHaveBeenCalledWith({
                name: achievementWithMultipleConditions.name,
                iconUrl: achievementWithMultipleConditions.iconUrl
            });
            expect(result).toEqual(mockAchievement);
        });
    });

    describe('data integrity', () => {
        it('should correctly pass data when creating', async () => {
            const achievementData = {
                name: 'Data Integrity Test',
                iconUrl: 'https://example.com/special-icon.png',
                conditions: [
                    { type: 'SPECIAL_CONDITION', value: 42 }
                ]
            };

            const mockAchievement = {
                id: 1,
                name: achievementData.name,
                iconUrl: achievementData.iconUrl,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            AchievementRepository.create.mockResolvedValue(mockAchievement);

            const result = await AchievementService.create(achievementData);

            expect(AchievementRepository.create).toHaveBeenCalledWith({
                name: achievementData.name,
                iconUrl: achievementData.iconUrl
            });
            expect(result).toEqual(mockAchievement);
        });

        it('should successfully create achievement when iconUrl is null', async () => {
            const achievementWithNullIcon = {
                name: 'Test Achievement',
                iconUrl: null,
                conditions: [
                    { type: 'EVENT_COUNT', value: 5 }
                ]
            };

            const mockAchievement = {
                id: 1,
                name: achievementWithNullIcon.name,
                iconUrl: null
            };

            AchievementRepository.create.mockResolvedValue(mockAchievement);

            const result = await AchievementService.create(achievementWithNullIcon);

            expect(AchievementRepository.create).toHaveBeenCalledWith({
                name: achievementWithNullIcon.name,
                iconUrl: null
            });
            expect(result).toEqual(mockAchievement);
        });

        it('should successfully create achievement when iconUrl is undefined', async () => {
            const achievementWithUndefinedIcon = {
                name: 'Test Achievement',
                iconUrl: undefined,
                conditions: [
                    { type: 'EVENT_COUNT', value: 5 }
                ]
            };

            const mockAchievement = {
                id: 1,
                name: achievementWithUndefinedIcon.name,
                iconUrl: undefined
            };

            AchievementRepository.create.mockResolvedValue(mockAchievement);

            const result = await AchievementService.create(achievementWithUndefinedIcon);

            expect(AchievementRepository.create).toHaveBeenCalledWith({
                name: achievementWithUndefinedIcon.name,
                iconUrl: undefined
            });
            expect(result).toEqual(mockAchievement);
        });
    });
}); 