const EventEndConditionService = require('../../service/EventEndConditionService');
const { EventEndCondition } = require('../../model');
const EndConditionService = require('../../service/EndConditionService');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../model');
jest.mock('../../service/EndConditionService');

describe('EventEndConditionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validEventEndConditionData = {
            eventId: 1,
            conditions: [
                {
                    name: 'BANK',
                    operator: 'GREATER_EQUALS',
                    value: '1000'
                },
                {
                    name: 'TIME',
                    operator: 'LESS_EQUALS',
                    value: '2024-12-31T23:59:59Z'
                }
            ]
        };

        it('should successfully create a group of event end conditions', async () => {
            const mockEventEndCondition = {
                id: 1,
                eventId: 1,
                isCompleted: false,
                isFailed: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const mockEndCondition1 = {
                id: 1,
                name: 'BANK',
                operator: 'GREATER_EQUALS',
                value: '1000',
                endConditionId: 1
            };

            const mockEndCondition2 = {
                id: 2,
                name: 'TIME',
                operator: 'LESS_EQUALS',
                value: '2024-12-31T23:59:59Z',
                endConditionId: 1
            };

            EventEndCondition.create.mockResolvedValue(mockEventEndCondition);
            EndConditionService.create
                .mockResolvedValueOnce(mockEndCondition1)
                .mockResolvedValueOnce(mockEndCondition2);

            const result = await EventEndConditionService.create(validEventEndConditionData);

            expect(EventEndCondition.create).toHaveBeenCalledWith({
                eventId: 1
            });
            expect(EndConditionService.create).toHaveBeenCalledTimes(2);
            expect(EndConditionService.create).toHaveBeenNthCalledWith(1, {
                name: 'BANK',
                operator: 'GREATER_EQUALS',
                value: '1000',
                endConditionId: 1
            });
            expect(EndConditionService.create).toHaveBeenNthCalledWith(2, {
                name: 'TIME',
                operator: 'LESS_EQUALS',
                value: '2024-12-31T23:59:59Z',
                endConditionId: 1
            });
            expect(result).toEqual(mockEventEndCondition);
        });

        it('should create a group of conditions with one condition', async () => {
            const singleConditionData = {
                eventId: 2,
                conditions: [
                    {
                        name: 'PARTICIPATION',
                        operator: 'GREATER_EQUALS',
                        value: '10'
                    }
                ]
            };

            const mockEventEndCondition = {
                id: 2,
                eventId: 2,
                isCompleted: false,
                isFailed: false
            };

            const mockEndCondition = {
                id: 3,
                name: 'PARTICIPATION',
                operator: 'GREATER_EQUALS',
                value: '10',
                endConditionId: 2
            };

            EventEndCondition.create.mockResolvedValue(mockEventEndCondition);
            EndConditionService.create.mockResolvedValue(mockEndCondition);

            const result = await EventEndConditionService.create(singleConditionData);

            expect(EventEndCondition.create).toHaveBeenCalledWith({
                eventId: 2
            });
            expect(EndConditionService.create).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockEventEndCondition);
        });

        it('should handle error when creating a group of conditions', async () => {
            const dbError = new Error('Database connection error');
            EventEndCondition.create.mockRejectedValue(dbError);

            await expect(EventEndConditionService.create(validEventEndConditionData))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle error when creating conditions', async () => {
            const mockEventEndCondition = {
                id: 1,
                eventId: 1,
                isCompleted: false,
                isFailed: false
            };

            const endConditionError = new Error('EndCondition creation error');
            EventEndCondition.create.mockResolvedValue(mockEventEndCondition);
            EndConditionService.create.mockRejectedValue(endConditionError);

            await expect(EventEndConditionService.create(validEventEndConditionData))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle empty array of conditions', async () => {
            const emptyConditionsData = {
                eventId: 3,
                conditions: []
            };

            const mockEventEndCondition = {
                id: 3,
                eventId: 3,
                isCompleted: false,
                isFailed: false
            };

            EventEndCondition.create.mockResolvedValue(mockEventEndCondition);

            const result = await EventEndConditionService.create(emptyConditionsData);

            expect(EventEndCondition.create).toHaveBeenCalledWith({
                eventId: 3
            });
            expect(EndConditionService.create).not.toHaveBeenCalled();
            expect(result).toEqual(mockEventEndCondition);
        });
    });

    describe('findByEventWithConditions', () => {
        it('should find event conditions with enabled conditions', async () => {
            const mockEventEndConditions = [
                {
                    id: 1,
                    eventId: 1,
                    isCompleted: false,
                    isFailed: false,
                    conditions: [
                        {
                            id: 1,
                            name: 'BANK',
                            operator: 'GREATER_EQUALS',
                            value: '1000',
                            endConditionId: 1
                        },
                        {
                            id: 2,
                            name: 'TIME',
                            operator: 'LESS_EQUALS',
                            value: '2024-12-31T23:59:59Z',
                            endConditionId: 1
                        }
                    ]
                }
            ];

            EventEndCondition.findAll.mockResolvedValue(mockEventEndConditions);

            const result = await EventEndConditionService.findByEventWithConditions(1);

            expect(EventEndCondition.findAll).toHaveBeenCalledWith({
                where: { eventId: 1 },
                include: [{
                    model: require('../../model').EndCondition,
                    as: 'conditions'
                }]
            });
            expect(result).toEqual(mockEventEndConditions);
        });

        it('should return empty array if conditions are not found', async () => {
            EventEndCondition.findAll.mockResolvedValue([]);

            const result = await EventEndConditionService.findByEventWithConditions(999);

            expect(result).toEqual([]);
        });

        it('should handle database error', async () => {
            const dbError = new Error('Database connection error');
            EventEndCondition.findAll.mockRejectedValue(dbError);

            await expect(EventEndConditionService.findByEventWithConditions(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findById', () => {
        it('should find event end condition by ID', async () => {
            const mockEventEndCondition = {
                id: 1,
                eventId: 1,
                isCompleted: false,
                isFailed: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            EventEndCondition.findByPk.mockResolvedValue(mockEventEndCondition);

            const result = await EventEndConditionService.findById(1);

            expect(EventEndCondition.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockEventEndCondition);
        });

        it('should return null if condition is not found', async () => {
            EventEndCondition.findByPk.mockResolvedValue(null);

            const result = await EventEndConditionService.findById(999);

            expect(result).toBeNull();
        });

        it('should handle database error', async () => {
            const dbError = new Error('Database connection error');
            EventEndCondition.findByPk.mockRejectedValue(dbError);

            await expect(EventEndConditionService.findById(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('updateCompletion', () => {
        it('should successfully update completion status', async () => {
            EventEndCondition.update.mockResolvedValue([1]); // one record updated

            const result = await EventEndConditionService.updateCompletion(1, true);

            expect(EventEndCondition.update).toHaveBeenCalledWith(
                { isCompleted: true },
                { where: { id: 1 } }
            );
            expect(result).toEqual([1]);
        });

        it('should update completion status to false', async () => {
            EventEndCondition.update.mockResolvedValue([1]);

            const result = await EventEndConditionService.updateCompletion(2, false);

            expect(EventEndCondition.update).toHaveBeenCalledWith(
                { isCompleted: false },
                { where: { id: 2 } }
            );
            expect(result).toEqual([1]);
        });

        it('should return [0] if condition is not found', async () => {
            EventEndCondition.update.mockResolvedValue([0]); // records not found

            const result = await EventEndConditionService.updateCompletion(999, true);

            expect(result).toEqual([0]);
        });

        it('should handle database error when updating', async () => {
            const dbError = new Error('Database constraint error');
            EventEndCondition.update.mockRejectedValue(dbError);

            await expect(EventEndConditionService.updateCompletion(1, true))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('updateFailure', () => {
        it('should successfully update failure status', async () => {
            EventEndCondition.update.mockResolvedValue([1]); // one record updated

            const result = await EventEndConditionService.updateFailure(1, true);

            expect(EventEndCondition.update).toHaveBeenCalledWith(
                { isFailed: true },
                { where: { id: 1 } }
            );
            expect(result).toEqual([1]);
        });

        it('should update failure status to false', async () => {
            EventEndCondition.update.mockResolvedValue([1]);

            const result = await EventEndConditionService.updateFailure(2, false);

            expect(EventEndCondition.update).toHaveBeenCalledWith(
                { isFailed: false },
                { where: { id: 2 } }
            );
            expect(result).toEqual([1]);
        });

        it('should return [0] if condition is not found', async () => {
            EventEndCondition.update.mockResolvedValue([0]); // records not found

            const result = await EventEndConditionService.updateFailure(999, true);

            expect(result).toEqual([0]);
        });

        it('should handle database error when updating', async () => {
            const dbError = new Error('Database constraint error');
            EventEndCondition.update.mockRejectedValue(dbError);

            await expect(EventEndConditionService.updateFailure(1, true))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findByEventId', () => {
        it('should find event end conditions by event ID', async () => {
            const mockEventEndConditions = [
                {
                    id: 1,
                    eventId: 1,
                    isCompleted: false,
                    isFailed: false,
                    conditions: [
                        {
                            id: 1,
                            name: 'BANK',
                            operator: 'GREATER_EQUALS',
                            value: '1000',
                            endConditionId: 1
                        }
                    ]
                },
                {
                    id: 2,
                    eventId: 1,
                    isCompleted: true,
                    isFailed: false,
                    conditions: [
                        {
                            id: 2,
                            name: 'PARTICIPATION',
                            operator: 'GREATER_EQUALS',
                            value: '5',
                            endConditionId: 2
                        }
                    ]
                }
            ];

            EventEndCondition.findAll.mockResolvedValue(mockEventEndConditions);

            const result = await EventEndConditionService.findByEventId(1);

            expect(EventEndCondition.findAll).toHaveBeenCalledWith({
                where: { eventId: 1 },
                include: [{
                    model: require('../../model').EndCondition,
                    as: 'conditions'
                }]
            });
            expect(result).toEqual(mockEventEndConditions);
        });

        it('should return empty array if conditions are not found', async () => {
            EventEndCondition.findAll.mockResolvedValue([]);

            const result = await EventEndConditionService.findByEventId(999);

            expect(result).toEqual([]);
        });

        it('should handle database error', async () => {
            const dbError = new Error('Database connection error');
            EventEndCondition.findAll.mockRejectedValue(dbError);

            await expect(EventEndConditionService.findByEventId(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('edge cases', () => {
        it('should handle invalid data for eventId', async () => {
            const invalidData = {
                eventId: 'invalid_id',
                conditions: []
            };

            const dbError = new Error('Invalid eventId type');
            EventEndCondition.create.mockRejectedValue(dbError);

            await expect(EventEndConditionService.create(invalidData))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle invalid data for ID in search methods', async () => {
            const dbError = new Error('Invalid ID type');
            EventEndCondition.findByPk.mockRejectedValue(dbError);

            await expect(EventEndConditionService.findById('invalid_id'))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle invalid boolean values in updateCompletion', async () => {
            EventEndCondition.update.mockResolvedValue([1]);

            // Test with various "truthy" values
            await EventEndConditionService.updateCompletion(1, 1);
            expect(EventEndCondition.update).toHaveBeenCalledWith(
                { isCompleted: 1 },
                { where: { id: 1 } }
            );

            await EventEndConditionService.updateCompletion(1, 0);
            expect(EventEndCondition.update).toHaveBeenCalledWith(
                { isCompleted: 0 },
                { where: { id: 1 } }
            );
        });

        it('should handle invalid boolean values in updateFailure', async () => {
            EventEndCondition.update.mockResolvedValue([1]);

            // Test with various "truthy" values
            await EventEndConditionService.updateFailure(1, 'true');
            expect(EventEndCondition.update).toHaveBeenCalledWith(
                { isFailed: 'true' },
                { where: { id: 1 } }
            );

            await EventEndConditionService.updateFailure(1, null);
            expect(EventEndCondition.update).toHaveBeenCalledWith(
                { isFailed: null },
                { where: { id: 1 } }
            );
        });
    });

    describe('data validation', () => {
        it('should correctly handle all condition types', async () => {
            const allConditionTypesData = {
                eventId: 1,
                conditions: [
                    {
                        name: 'BANK',
                        operator: 'GREATER_EQUALS',
                        value: '1000'
                    },
                    {
                        name: 'TIME',
                        operator: 'LESS_EQUALS',
                        value: '2024-12-31T23:59:59Z'
                    },
                    {
                        name: 'PARTICIPATION',
                        operator: 'EQUALS',
                        value: '10'
                    }
                ]
            };

            const mockEventEndCondition = {
                id: 1,
                eventId: 1,
                isCompleted: false,
                isFailed: false
            };

            EventEndCondition.create.mockResolvedValue(mockEventEndCondition);
            EndConditionService.create.mockResolvedValue({});

            const result = await EventEndConditionService.create(allConditionTypesData);

            expect(EndConditionService.create).toHaveBeenCalledTimes(3);
            expect(result).toEqual(mockEventEndCondition);
        });

        it('should correctly handle all operators', async () => {
            const allOperatorsData = {
                eventId: 1,
                conditions: [
                    {
                        name: 'BANK',
                        operator: 'EQUALS',
                        value: '1000'
                    },
                    {
                        name: 'BANK',
                        operator: 'GREATER',
                        value: '500'
                    },
                    {
                        name: 'BANK',
                        operator: 'LESS',
                        value: '2000'
                    },
                    {
                        name: 'BANK',
                        operator: 'GREATER_EQUALS',
                        value: '1000'
                    },
                    {
                        name: 'BANK',
                        operator: 'LESS_EQUALS',
                        value: '1500'
                    }
                ]
            };

            const mockEventEndCondition = {
                id: 1,
                eventId: 1,
                isCompleted: false,
                isFailed: false
            };

            EventEndCondition.create.mockResolvedValue(mockEventEndCondition);
            EndConditionService.create.mockResolvedValue({});

            const result = await EventEndConditionService.create(allOperatorsData);

            expect(EndConditionService.create).toHaveBeenCalledTimes(5);
            expect(result).toEqual(mockEventEndCondition);
        });
    });
}); 