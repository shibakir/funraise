// Mock dependencies
jest.mock('../../repository', () => ({
    AchievementCriterionRepository: {
        create: jest.fn(),
        findByType: jest.fn(),
        findByPk: jest.fn()
    }
}));

const AchievementCriterionService = require('../../service/AchievementCriterionService');
const { AchievementCriterionRepository } = require('../../repository');
const ApiError = require('../../exception/ApiError');

describe('AchievementCriterionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validCriterionData = {
            type: 'EVENT_COUNT_ALL',
            value: 5
        };

        it('should successfully create an achievement criterion', async () => {
            const mockCriterion = {
                id: 1,
                type: validCriterionData.type,
                value: validCriterionData.value
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(validCriterionData);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: validCriterionData.type,
                value: validCriterionData.value
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should accept missing type (no validation in service)', async () => {
            const dataWithMissingType = {
                value: 5
                // type is missing - undefined will be passed
            };

            const mockCriterion = {
                id: 1,
                type: undefined,
                value: 5
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(dataWithMissingType);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: undefined,
                value: 5
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should accept missing value (no validation in service)', async () => {
            const dataWithMissingValue = {
                type: 'EVENT_COUNT_ALL'
                // value is missing - undefined will be passed
            };

            const mockCriterion = {
                id: 1,
                type: 'EVENT_COUNT_ALL',
                value: undefined
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(dataWithMissingValue);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: 'EVENT_COUNT_ALL',
                value: undefined
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should accept empty string type (no validation in service)', async () => {
            const dataWithEmptyType = {
                type: '',
                value: 5
            };

            const mockCriterion = {
                id: 1,
                type: '',
                value: 5
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(dataWithEmptyType);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: '',
                value: 5
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should accept non-number value (no validation in service)', async () => {
            const dataWithStringValue = {
                type: 'EVENT_COUNT_ALL',
                value: 'not a number'
            };

            const mockCriterion = {
                id: 1,
                type: 'EVENT_COUNT_ALL',
                value: 'not a number'
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(dataWithStringValue);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: 'EVENT_COUNT_ALL',
                value: 'not a number'
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should accept zero as a valid value', async () => {
            const validDataWithZero = {
                type: 'EVENT_COUNT_ALL',
                value: 0
            };

            const mockCriterion = {
                id: 1,
                type: validDataWithZero.type,
                value: validDataWithZero.value
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(validDataWithZero);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: validDataWithZero.type,
                value: validDataWithZero.value
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should accept negative values', async () => {
            const validDataWithNegative = {
                type: 'EVENT_COUNT_ALL',
                value: -1
            };

            const mockCriterion = {
                id: 1,
                type: validDataWithNegative.type,
                value: validDataWithNegative.value
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(validDataWithNegative);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: validDataWithNegative.type,
                value: validDataWithNegative.value
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database constraint violation');
            AchievementCriterionRepository.create.mockRejectedValue(dbError);

            await expect(AchievementCriterionService.create(validCriterionData))
                .rejects
                .toThrow('Error creating achievement');
        });

        it('should handle all valid criterion types', async () => {
            const validTypes = [
                'EVENT_BANK_COMPLETED',
                'EVENT_PEOPLE_COMPLETED',
                'EVENT_TIME_COMPLETED',
                'EVENT_INCOME_ONETIME',
                'EVENT_INCOME_ALL',
                'EVENT_COUNT_ALL',
                'EVENT_COUNT_CREATED',
                'EVENT_COUNT_COMPLETED',
                'USER_ACTIVITY',
                'USER_BANK'
            ];

            for (const type of validTypes) {
                const criterionData = { type, value: 10 };
                const mockCriterion = { id: 1, type, value: 10 };

                AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

                const result = await AchievementCriterionService.create(criterionData);

                expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                    type: type,
                    value: 10
                });
                expect(result).toEqual(mockCriterion);

                jest.clearAllMocks();
            }
        });
    });

    describe('findByType', () => {
        const criterionType = 'EVENT_COUNT_ALL';

        it('should find criteria by type with achievement associations', async () => {
            const mockCriteria = [
                {
                    id: 1,
                    type: criterionType,
                    value: 5,
                    achievement: {
                        id: 1,
                        name: 'Test Achievement 1',
                        iconUrl: 'https://example.com/icon1.png'
                    }
                },
                {
                    id: 2,
                    type: criterionType,
                    value: 10,
                    achievement: {
                        id: 2,
                        name: 'Test Achievement 2',
                        iconUrl: 'https://example.com/icon2.png'
                    }
                }
            ];

            AchievementCriterionRepository.findByType.mockResolvedValue(mockCriteria);

            const result = await AchievementCriterionService.findByType(criterionType);

            expect(AchievementCriterionRepository.findByType).toHaveBeenCalledWith(criterionType);
            expect(result).toEqual(mockCriteria);
        });

        it('should return empty array if no criteria found for type', async () => {
            AchievementCriterionRepository.findByType.mockResolvedValue([]);

            const result = await AchievementCriterionService.findByType('NON_EXISTENT_TYPE');

            expect(AchievementCriterionRepository.findByType).toHaveBeenCalledWith('NON_EXISTENT_TYPE');
            expect(result).toEqual([]);
        });

        it('should handle database errors when finding by type', async () => {
            const dbError = new Error('Database connection error');
            AchievementCriterionRepository.findByType.mockRejectedValue(dbError);

            await expect(AchievementCriterionService.findByType(criterionType))
                .rejects
                .toThrow('Error finding criteria by type');
        });

        it('should work with null criterionType', async () => {
            AchievementCriterionRepository.findByType.mockResolvedValue([]);

            const result = await AchievementCriterionService.findByType(null);

            expect(AchievementCriterionRepository.findByType).toHaveBeenCalledWith(null);
            expect(result).toEqual([]);
        });

        it('should work with undefined criterionType', async () => {
            AchievementCriterionRepository.findByType.mockResolvedValue([]);

            const result = await AchievementCriterionService.findByType(undefined);

            expect(AchievementCriterionRepository.findByType).toHaveBeenCalledWith(undefined);
            expect(result).toEqual([]);
        });
    });

    describe('findById', () => {
        const criterionId = 1;

        it('should find criterion by ID', async () => {
            const mockCriterion = {
                id: criterionId,
                type: 'EVENT_COUNT_ALL',
                value: 5
            };

            AchievementCriterionRepository.findByPk.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.findById(criterionId);

            expect(AchievementCriterionRepository.findByPk).toHaveBeenCalledWith(criterionId);
            expect(result).toEqual(mockCriterion);
        });

        it('should handle database errors and throw ApiError', async () => {
            const dbError = new Error('Database connection error');
            AchievementCriterionRepository.findByPk.mockRejectedValue(dbError);

            await expect(AchievementCriterionService.findById(criterionId))
                .rejects
                .toThrow(ApiError);
        });

        it('should re-throw ApiError if it\'s already an ApiError', async () => {
            const apiError = ApiError.notFound('Custom not found message');
            AchievementCriterionRepository.findByPk.mockRejectedValue(apiError);

            await expect(AchievementCriterionService.findById(criterionId))
                .rejects
                .toThrow(apiError);
        });

        it('should work with string ID', async () => {
            const stringId = '1';
            const mockCriterion = {
                id: 1,
                type: 'EVENT_COUNT_ALL',
                value: 5
            };

            AchievementCriterionRepository.findByPk.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.findById(stringId);

            expect(AchievementCriterionRepository.findByPk).toHaveBeenCalledWith(stringId);
            expect(result).toEqual(mockCriterion);
        });

        it('should work with null ID', async () => {
            AchievementCriterionRepository.findByPk.mockResolvedValue(null);

            const result = await AchievementCriterionService.findById(null);

            expect(result).toBeNull();
        });

        it('should work with undefined ID', async () => {
            AchievementCriterionRepository.findByPk.mockResolvedValue(null);

            const result = await AchievementCriterionService.findById(undefined);

            expect(result).toBeNull();
        });
    });

    describe('error handling', () => {
        it('should handle any data in create method (no validation)', async () => {
            const anyData = {
                type: '',
                value: 'invalid'
            };

            const mockCriterion = {
                id: 1,
                type: '',
                value: 'invalid'
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(anyData);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: '',
                value: 'invalid'
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should correctly handle database errors in create method', async () => {
            const validData = {
                type: 'EVENT_COUNT_ALL',
                value: 5
            };

            const dbError = new Error('Database error');
            AchievementCriterionRepository.create.mockRejectedValue(dbError);

            try {
                await AchievementCriterionService.create(validData);
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                expect(error.message).toContain('Error creating achievement');
            }
        });

        it('should correctly handle database errors in findByType method', async () => {
            const dbError = new Error('Database connection lost');
            AchievementCriterionRepository.findByType.mockRejectedValue(dbError);

            try {
                await AchievementCriterionService.findByType('EVENT_COUNT_ALL');
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                expect(error.message).toContain('Error finding criteria by type');
            }
        });

        it('should correctly handle database errors in findById method', async () => {
            const dbError = new Error('Database timeout');
            AchievementCriterionRepository.findByPk.mockRejectedValue(dbError);

            try {
                await AchievementCriterionService.findById(1);
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                expect(error.message).toContain('Error finding achievement criterion by ID');
            }
        });
    });

    describe('data integrity', () => {
        it('should correctly pass all data fields when creating', async () => {
            const criterionData = {
                type: 'USER_BANK',
                value: 1000
            };

            const mockCriterion = {
                id: 1,
                type: criterionData.type,
                value: criterionData.value,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(criterionData);

            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: criterionData.type,
                value: criterionData.value
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should ignore extra fields (only type and value are extracted)', async () => {
            const criterionDataWithExtra = {
                type: 'EVENT_COUNT_ALL',
                value: 5,
                extraField: 'will be ignored',
                anotherExtra: 123
            };

            const mockCriterion = {
                id: 1,
                type: 'EVENT_COUNT_ALL',
                value: 5
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(criterionDataWithExtra);

            // Only type and value should be passed to repository
            expect(AchievementCriterionRepository.create).toHaveBeenCalledWith({
                type: 'EVENT_COUNT_ALL',
                value: 5
            });
            expect(result).toEqual(mockCriterion);
        });
    });

    describe('business logic validation', () => {
        it('should handle large values correctly', async () => {
            const largeValueData = {
                type: 'EVENT_COUNT_ALL',
                value: 999999999
            };

            const mockCriterion = {
                id: 1,
                type: largeValueData.type,
                value: largeValueData.value
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(largeValueData);

            expect(result).toEqual(mockCriterion);
        });

        it('should handle floating point values correctly', async () => {
            const floatValueData = {
                type: 'EVENT_COUNT_ALL',
                value: 5.5
            };

            const mockCriterion = {
                id: 1,
                type: floatValueData.type,
                value: floatValueData.value
            };

            AchievementCriterionRepository.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(floatValueData);

            expect(result).toEqual(mockCriterion);
        });
    });
}); 