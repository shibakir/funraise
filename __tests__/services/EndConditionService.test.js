const EndConditionService = require('../../service/EndConditionService');
const { EndCondition } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../model');

describe('EndConditionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validEndConditionData = {
            name: 'AMOUNT',
            operator: 'GREATER_EQUALS',
            value: '1000',
            endConditionId: 1
        };

        it('should successfully create an end condition', async () => {
            const mockEndCondition = {
                id: 1,
                ...validEndConditionData,
                isCompleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            EndCondition.create.mockResolvedValue(mockEndCondition);

            const result = await EndConditionService.create(validEndConditionData);

            expect(EndCondition.create).toHaveBeenCalledWith({
                name: validEndConditionData.name,
                operator: validEndConditionData.operator,
                value: validEndConditionData.value,
                endConditionId: validEndConditionData.endConditionId
            });
            expect(result).toEqual(mockEndCondition);
        });

        it('should validate input data', async () => {
            const invalidData = {
                name: '', // empty name
                operator: 'invalid_operator',
                value: -100,
                endConditionId: 1
            };

            await expect(EndConditionService.create(invalidData))
                .rejects
                .toThrow();
        });

        it('should require all required fields', async () => {
            const incompleteData = {
                name: 'AMOUNT',
                operator: 'gte'
                // value and endConditionId are missing
            };

            await expect(EndConditionService.create(incompleteData))
                .rejects
                .toThrow();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database constraint violation');
            EndCondition.create.mockRejectedValue(dbError);

            await expect(EndConditionService.create(validEndConditionData))
                .rejects
                .toThrow('Error creating end condition');
        });

        it('should create a TIME condition', async () => {
            const timeConditionData = {
                name: 'TIME',
                operator: 'LESS_EQUALS',
                value: '2024-12-31T23:59:59Z',
                endConditionId: 2
            };

            const mockTimeCondition = {
                id: 2,
                ...timeConditionData,
                isCompleted: false
            };

            EndCondition.create.mockResolvedValue(mockTimeCondition);

            const result = await EndConditionService.create(timeConditionData);

            expect(EndCondition.create).toHaveBeenCalledWith({
                name: timeConditionData.name,
                operator: timeConditionData.operator,
                value: timeConditionData.value,
                endConditionId: timeConditionData.endConditionId
            });
            expect(result).toEqual(mockTimeCondition);
        });

        it('should create a PARTICIPATION_COUNT condition', async () => {
            const participationConditionData = {
                name: 'PARTICIPATION_COUNT',
                operator: 'GREATER_EQUALS',
                value: '10',
                endConditionId: 3
            };

            const mockParticipationCondition = {
                id: 3,
                ...participationConditionData,
                isCompleted: false
            };

            EndCondition.create.mockResolvedValue(mockParticipationCondition);

            const result = await EndConditionService.create(participationConditionData);

            expect(EndCondition.create).toHaveBeenCalledWith({
                name: participationConditionData.name,
                operator: participationConditionData.operator,
                value: participationConditionData.value,
                endConditionId: participationConditionData.endConditionId
            });
            expect(result).toEqual(mockParticipationCondition);
        });
    });

    describe('findById', () => {
        it('should find an end condition by ID', async () => {
            const mockEndCondition = {
                id: 1,
                name: 'AMOUNT',
                operator: 'gte',
                value: 1000,
                endConditionId: 1,
                isCompleted: false
            };

            EndCondition.findByPk.mockResolvedValue(mockEndCondition);

            const result = await EndConditionService.findById(1);

            expect(EndCondition.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockEndCondition);
        });

        it('should return null if the condition is not found', async () => {
            EndCondition.findByPk.mockResolvedValue(null);

            const result = await EndConditionService.findById(999);

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            EndCondition.findByPk.mockRejectedValue(dbError);

            await expect(EndConditionService.findById(1))
                .rejects
                .toThrow('Error finding end condition by ID');
        });
    });

    describe('findByEventEndCondition', () => {
        it('should find all conditions by event end condition ID', async () => {
            const mockEndConditions = [
                {
                    id: 1,
                    name: 'AMOUNT',
                    operator: 'gte',
                    value: 1000,
                    endConditionId: 1,
                    isCompleted: false
                },
                {
                    id: 2,
                    name: 'TIME',
                    operator: 'lte',
                    value: '2024-12-31T23:59:59Z',
                    endConditionId: 1,
                    isCompleted: false
                }
            ];

            EndCondition.findAll.mockResolvedValue(mockEndConditions);

            const result = await EndConditionService.findByEventEndCondition(1);

            expect(EndCondition.findAll).toHaveBeenCalledWith({
                where: { endConditionId: 1 }
            });
            expect(result).toEqual(mockEndConditions);
        });

        it('should return an empty array if conditions are not found', async () => {
            EndCondition.findAll.mockResolvedValue([]);

            const result = await EndConditionService.findByEventEndCondition(999);

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            EndCondition.findAll.mockRejectedValue(dbError);

            await expect(EndConditionService.findByEventEndCondition(1))
                .rejects
                .toThrow('Error finding end conditions by event end condition');
        });
    });

    describe('updateCompletion', () => {
        it('should successfully update the completion status of a condition', async () => {
            EndCondition.update.mockResolvedValue([1]); // one record updated

            const result = await EndConditionService.updateCompletion(1, true);

            expect(EndCondition.update).toHaveBeenCalledWith(
                { isCompleted: true },
                { where: { id: 1 } }
            );
            expect(result).toEqual([1]);
        });

        it('should update the completion status to false', async () => {
            EndCondition.update.mockResolvedValue([1]);

            const result = await EndConditionService.updateCompletion(2, false);

            expect(EndCondition.update).toHaveBeenCalledWith(
                { isCompleted: false },
                { where: { id: 2 } }
            );
            expect(result).toEqual([1]);
        });

        it('should return [0] if the condition is not found', async () => {
            EndCondition.update.mockResolvedValue([0]); // records not found

            const result = await EndConditionService.updateCompletion(999, true);

            expect(result).toEqual([0]);
        });

        it('should handle database errors when updating', async () => {
            const dbError = new Error('Database constraint error');
            EndCondition.update.mockRejectedValue(dbError);

            await expect(EndConditionService.updateCompletion(1, true))
                .rejects
                .toThrow('Error updating end condition completion');
        });
    });

    describe('validation edge cases', () => {
        it('должен валидировать корректные операторы', async () => {
            const validOperators = ['GREATER_EQUALS', 'LESS_EQUALS', 'EQUALS', 'GREATER', 'LESS'];
            
            for (const operator of validOperators) {
                const conditionData = {
                    name: 'AMOUNT',
                    operator: operator,
                    value: '1000',
                    endConditionId: 1
                };

                const mockCondition = {
                    id: 1,
                    ...conditionData
                };

                EndCondition.create.mockResolvedValue(mockCondition);

                const result = await EndConditionService.create(conditionData);
                expect(result.operator).toBe(operator);
            }
        });

        it('should validate correct condition types', async () => {
            const validConditionTypes = ['AMOUNT', 'TIME', 'PARTICIPATION_COUNT'];
            
            for (const conditionType of validConditionTypes) {
                const conditionData = {
                    name: conditionType,
                    operator: 'GREATER_EQUALS',
                    value: conditionType === 'TIME' ? '2024-12-31T23:59:59Z' : '1000',
                    endConditionId: 1
                };

                const mockCondition = {
                    id: 1,
                    ...conditionData
                };

                EndCondition.create.mockResolvedValue(mockCondition);

                const result = await EndConditionService.create(conditionData);
                expect(result.name).toBe(conditionType);
            }
        });
    });

    describe('data types handling', () => {
        it('should correctly handle numeric values', async () => {
            const numericConditionData = {
                name: 'AMOUNT',
                operator: 'GREATER_EQUALS',
                value: '1500.5', // fractional number
                endConditionId: 1
            };

            const mockCondition = {
                id: 1,
                ...numericConditionData
            };

            EndCondition.create.mockResolvedValue(mockCondition);

            const result = await EndConditionService.create(numericConditionData);

            expect(result.value).toBe('1500.5');
        });

        it('should correctly handle string values for dates', async () => {
            const dateConditionData = {
                name: 'TIME',
                operator: 'LESS_EQUALS',
                value: '2024-12-31T23:59:59.999Z',
                endConditionId: 1
            };

            const mockCondition = {
                id: 1,
                ...dateConditionData
            };

            EndCondition.create.mockResolvedValue(mockCondition);

            const result = await EndConditionService.create(dateConditionData);

            expect(result.value).toBe('2024-12-31T23:59:59.999Z');
        });
    });
}); 