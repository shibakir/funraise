const AchievementCriterionService = require('../../service/AchievementCriterionService');
const { AchievementCriterion, Achievement } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../model');

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

            AchievementCriterion.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(validCriterionData);

            expect(AchievementCriterion.create).toHaveBeenCalledWith({
                type: validCriterionData.type,
                value: validCriterionData.value
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should throw a validation error if type is missing', async () => {
            const invalidData = {
                value: 5
                // type is missing
            };

            await expect(AchievementCriterionService.create(invalidData))
                .rejects
                .toThrow(ApiError);
        });

        it('should throw a validation error if value is missing', async () => {
            const invalidData = {
                type: 'EVENT_COUNT_ALL'
                // value is missing
            };

            await expect(AchievementCriterionService.create(invalidData))
                .rejects
                .toThrow(ApiError);
        });

        it('should throw a validation error if type is empty string', async () => {
            const invalidData = {
                type: '',
                value: 5
            };

            await expect(AchievementCriterionService.create(invalidData))
                .rejects
                .toThrow(ApiError);
        });

        it('should throw a validation error if value is not a number', async () => {
            const invalidData = {
                type: 'EVENT_COUNT_ALL',
                value: 'not a number'
            };

            await expect(AchievementCriterionService.create(invalidData))
                .rejects
                .toThrow(ApiError);
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

            AchievementCriterion.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(validDataWithZero);

            expect(AchievementCriterion.create).toHaveBeenCalledWith({
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

            AchievementCriterion.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(validDataWithNegative);

            expect(AchievementCriterion.create).toHaveBeenCalledWith({
                type: validDataWithNegative.type,
                value: validDataWithNegative.value
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database constraint violation');
            AchievementCriterion.create.mockRejectedValue(dbError);

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

                AchievementCriterion.create.mockResolvedValue(mockCriterion);

                const result = await AchievementCriterionService.create(criterionData);

                expect(AchievementCriterion.create).toHaveBeenCalledWith({
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

            AchievementCriterion.findAll.mockResolvedValue(mockCriteria);

            const result = await AchievementCriterionService.findByType(criterionType);

            expect(AchievementCriterion.findAll).toHaveBeenCalledWith({
                where: { type: criterionType },
                include: [{
                    model: Achievement,
                    as: 'achievement'
                }]
            });
            expect(result).toEqual(mockCriteria);
        });

        it('should return empty array if no criteria found for type', async () => {
            AchievementCriterion.findAll.mockResolvedValue([]);

            const result = await AchievementCriterionService.findByType('NON_EXISTENT_TYPE');

            expect(AchievementCriterion.findAll).toHaveBeenCalledWith({
                where: { type: 'NON_EXISTENT_TYPE' },
                include: [{
                    model: Achievement,
                    as: 'achievement'
                }]
            });
            expect(result).toEqual([]);
        });

        it('should handle database errors when finding by type', async () => {
            const dbError = new Error('Database connection error');
            AchievementCriterion.findAll.mockRejectedValue(dbError);

            await expect(AchievementCriterionService.findByType(criterionType))
                .rejects
                .toThrow('Error finding criteria by type');
        });

        it('should work with null criterionType', async () => {
            AchievementCriterion.findAll.mockResolvedValue([]);

            const result = await AchievementCriterionService.findByType(null);

            expect(AchievementCriterion.findAll).toHaveBeenCalledWith({
                where: { type: null },
                include: [{
                    model: Achievement,
                    as: 'achievement'
                }]
            });
            expect(result).toEqual([]);
        });

        it('should work with undefined criterionType', async () => {
            AchievementCriterion.findAll.mockResolvedValue([]);

            const result = await AchievementCriterionService.findByType(undefined);

            expect(AchievementCriterion.findAll).toHaveBeenCalledWith({
                where: { type: undefined },
                include: [{
                    model: Achievement,
                    as: 'achievement'
                }]
            });
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

            AchievementCriterion.findByPk.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.findById(criterionId);

            expect(AchievementCriterion.findByPk).toHaveBeenCalledWith(criterionId);
            expect(result).toEqual(mockCriterion);
        });

        it('should throw ApiError if criterion not found', async () => {
            AchievementCriterion.findByPk.mockResolvedValue(null);

            await expect(AchievementCriterionService.findById(999))
                .rejects
                .toThrow(ApiError);

            try {
                await AchievementCriterionService.findById(999);
            } catch (error) {
                expect(error.message).toBe('Achievement criterion not found');
            }
        });

        it('should handle database errors and throw ApiError', async () => {
            const dbError = new Error('Database connection error');
            AchievementCriterion.findByPk.mockRejectedValue(dbError);

            await expect(AchievementCriterionService.findById(criterionId))
                .rejects
                .toThrow(ApiError);
        });

        it('should re-throw ApiError if it\'s already an ApiError', async () => {
            const apiError = ApiError.notFound('Custom not found message');
            AchievementCriterion.findByPk.mockRejectedValue(apiError);

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

            AchievementCriterion.findByPk.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.findById(stringId);

            expect(AchievementCriterion.findByPk).toHaveBeenCalledWith(stringId);
            expect(result).toEqual(mockCriterion);
        });

        it('should work with null ID', async () => {
            AchievementCriterion.findByPk.mockResolvedValue(null);

            await expect(AchievementCriterionService.findById(null))
                .rejects
                .toThrow('Achievement criterion not found');
        });

        it('should work with undefined ID', async () => {
            AchievementCriterion.findByPk.mockResolvedValue(null);

            await expect(AchievementCriterionService.findById(undefined))
                .rejects
                .toThrow('Achievement criterion not found');
        });
    });

    describe('error handling', () => {
        it('should correctly handle ApiError in create method', async () => {
            const invalidData = {
                type: '',
                value: 'invalid'
            };

            try {
                await AchievementCriterionService.create(invalidData);
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                expect(error.status).toBe(400);
            }
        });

        it('should correctly handle database errors in create method', async () => {
            const validData = {
                type: 'EVENT_COUNT_ALL',
                value: 5
            };

            const dbError = new Error('Database error');
            AchievementCriterion.create.mockRejectedValue(dbError);

            try {
                await AchievementCriterionService.create(validData);
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                expect(error.message).toContain('Error creating achievement');
            }
        });

        it('should correctly handle database errors in findByType method', async () => {
            const dbError = new Error('Database connection lost');
            AchievementCriterion.findAll.mockRejectedValue(dbError);

            try {
                await AchievementCriterionService.findByType('EVENT_COUNT_ALL');
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                expect(error.message).toContain('Error finding criteria by type');
            }
        });

        it('should correctly handle database errors in findById method', async () => {
            const dbError = new Error('Database timeout');
            AchievementCriterion.findByPk.mockRejectedValue(dbError);

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

            AchievementCriterion.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(criterionData);

            expect(AchievementCriterion.create).toHaveBeenCalledWith({
                type: criterionData.type,
                value: criterionData.value
            });
            expect(result).toEqual(mockCriterion);
        });

        it('should reject data with extra fields through validation', async () => {
            const criterionDataWithExtra = {
                type: 'EVENT_COUNT_ALL',
                value: 5,
                extraField: 'should not be allowed',
                anotherExtra: 123
            };

            await expect(AchievementCriterionService.create(criterionDataWithExtra))
                .rejects
                .toThrow(ApiError);

            // Check that create was not called due to validation error
            expect(AchievementCriterion.create).not.toHaveBeenCalled();
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

            AchievementCriterion.create.mockResolvedValue(mockCriterion);

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

            AchievementCriterion.create.mockResolvedValue(mockCriterion);

            const result = await AchievementCriterionService.create(floatValueData);

            expect(result).toEqual(mockCriterion);
        });
    });
}); 