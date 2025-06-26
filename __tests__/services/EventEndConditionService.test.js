// Mock dependencies
jest.mock('../../repository', () => ({
    EventEndConditionRepository: {
        create: jest.fn(),
        findByEventWithConditions: jest.fn(),
        findByPk: jest.fn(),
        updateCompletion: jest.fn(),
        updateFailure: jest.fn(),
        findByEventId: jest.fn()
    }
}));
jest.mock('../../service/EndConditionService');

const EventEndConditionService = require('../../service/EventEndConditionService');
const { EventEndConditionRepository } = require('../../repository');
const EndConditionService = require('../../service/EndConditionService');
const ApiError = require('../../exception/ApiError');

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

            EventEndConditionRepository.create.mockResolvedValue(mockEventEndCondition);
            EndConditionService.create
                .mockResolvedValueOnce(mockEndCondition1)
                .mockResolvedValueOnce(mockEndCondition2);

            const result = await EventEndConditionService.create(validEventEndConditionData);

            expect(EventEndConditionRepository.create).toHaveBeenCalledWith({
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

            EventEndConditionRepository.create.mockResolvedValue(mockEventEndCondition);
            EndConditionService.create.mockResolvedValue(mockEndCondition);

            const result = await EventEndConditionService.create(singleConditionData);

            expect(EventEndConditionRepository.create).toHaveBeenCalledWith({
                eventId: 2
            });
            expect(EndConditionService.create).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockEventEndCondition);
        });

        it('should handle error when creating a group of conditions', async () => {
            const dbError = new Error('Database connection error');
            EventEndConditionRepository.create.mockRejectedValue(dbError);

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
            EventEndConditionRepository.create.mockResolvedValue(mockEventEndCondition);
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

            EventEndConditionRepository.create.mockResolvedValue(mockEventEndCondition);

            const result = await EventEndConditionService.create(emptyConditionsData);

            expect(EventEndConditionRepository.create).toHaveBeenCalledWith({
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

            EventEndConditionRepository.findByEventWithConditions.mockResolvedValue(mockEventEndConditions);

            const result = await EventEndConditionService.findByEventWithConditions(1);

            expect(EventEndConditionRepository.findByEventWithConditions).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockEventEndConditions);
        });

        it('should return empty array if conditions are not found', async () => {
            EventEndConditionRepository.findByEventWithConditions.mockResolvedValue([]);

            const result = await EventEndConditionService.findByEventWithConditions(999);

            expect(result).toEqual([]);
        });

        it('should handle database error', async () => {
            const dbError = new Error('Database connection error');
            EventEndConditionRepository.findByEventWithConditions.mockRejectedValue(dbError);

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

            EventEndConditionRepository.findByPk.mockResolvedValue(mockEventEndCondition);

            const result = await EventEndConditionService.findById(1);

            expect(EventEndConditionRepository.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockEventEndCondition);
        });

        it('should return null if condition is not found', async () => {
            EventEndConditionRepository.findByPk.mockResolvedValue(null);

            const result = await EventEndConditionService.findById(999);

            expect(result).toBeNull();
        });

        it('should handle database error', async () => {
            const dbError = new Error('Database connection error');
            EventEndConditionRepository.findByPk.mockRejectedValue(dbError);

            await expect(EventEndConditionService.findById(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('updateCompletion', () => {
        it('should successfully update completion status', async () => {
            EventEndConditionRepository.updateCompletion.mockResolvedValue([1]); // one record updated

            const result = await EventEndConditionService.updateCompletion(1, true);

            expect(EventEndConditionRepository.updateCompletion).toHaveBeenCalledWith(1, true);
            expect(result).toEqual([1]);
        });

        it('should update completion status to false', async () => {
            EventEndConditionRepository.updateCompletion.mockResolvedValue([1]);

            const result = await EventEndConditionService.updateCompletion(2, false);

            expect(EventEndConditionRepository.updateCompletion).toHaveBeenCalledWith(2, false);
            expect(result).toEqual([1]);
        });

        it('should return [0] if condition is not found', async () => {
            EventEndConditionRepository.updateCompletion.mockResolvedValue([0]); // records not found

            const result = await EventEndConditionService.updateCompletion(999, true);

            expect(result).toEqual([0]);
        });

        it('should handle database error when updating', async () => {
            const dbError = new Error('Database constraint error');
            EventEndConditionRepository.updateCompletion.mockRejectedValue(dbError);

            await expect(EventEndConditionService.updateCompletion(1, true))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('updateFailure', () => {
        it('should successfully update failure status', async () => {
            EventEndConditionRepository.updateFailure.mockResolvedValue([1]); // one record updated

            const result = await EventEndConditionService.updateFailure(1, true);

            expect(EventEndConditionRepository.updateFailure).toHaveBeenCalledWith(1, true);
            expect(result).toEqual([1]);
        });

        it('should update failure status to false', async () => {
            EventEndConditionRepository.updateFailure.mockResolvedValue([1]);

            const result = await EventEndConditionService.updateFailure(2, false);

            expect(EventEndConditionRepository.updateFailure).toHaveBeenCalledWith(2, false);
            expect(result).toEqual([1]);
        });

        it('should return [0] if condition is not found', async () => {
            EventEndConditionRepository.updateFailure.mockResolvedValue([0]); // records not found

            const result = await EventEndConditionService.updateFailure(999, true);

            expect(result).toEqual([0]);
        });

        it('should handle database error when updating', async () => {
            const dbError = new Error('Database constraint error');
            EventEndConditionRepository.updateFailure.mockRejectedValue(dbError);

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

            EventEndConditionRepository.findByEventId.mockResolvedValue(mockEventEndConditions);

            const result = await EventEndConditionService.findByEventId(1);

            expect(EventEndConditionRepository.findByEventId).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockEventEndConditions);
        });

        it('should return empty array if conditions are not found', async () => {
            EventEndConditionRepository.findByEventId.mockResolvedValue([]);

            const result = await EventEndConditionService.findByEventId(999);

            expect(result).toEqual([]);
        });

        it('should handle database error', async () => {
            const dbError = new Error('Database connection error');
            EventEndConditionRepository.findByEventId.mockRejectedValue(dbError);

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
            EventEndConditionRepository.create.mockRejectedValue(dbError);

            await expect(EventEndConditionService.create(invalidData))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle invalid data for ID in search methods', async () => {
            const dbError = new Error('Invalid ID type');
            EventEndConditionRepository.findByPk.mockRejectedValue(dbError);

            await expect(EventEndConditionService.findById('invalid_id'))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle invalid boolean values in updateCompletion', async () => {
            EventEndConditionRepository.updateCompletion.mockResolvedValue([1]);

            // Test with various "truthy" values
            await EventEndConditionService.updateCompletion(1, 1);
            expect(EventEndConditionRepository.updateCompletion).toHaveBeenCalledWith(1, 1);

            await EventEndConditionService.updateCompletion(1, 0);
            expect(EventEndConditionRepository.updateCompletion).toHaveBeenCalledWith(1, 0);
        });

        it('should handle invalid boolean values in updateFailure', async () => {
            EventEndConditionRepository.updateFailure.mockResolvedValue([1]);

            // Test with various "truthy" values
            await EventEndConditionService.updateFailure(1, 'true');
            expect(EventEndConditionRepository.updateFailure).toHaveBeenCalledWith(1, 'true');

            await EventEndConditionService.updateFailure(1, null);
            expect(EventEndConditionRepository.updateFailure).toHaveBeenCalledWith(1, null);
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

            EventEndConditionRepository.create.mockResolvedValue(mockEventEndCondition);
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

            EventEndConditionRepository.create.mockResolvedValue(mockEventEndCondition);
            EndConditionService.create.mockResolvedValue({});

            const result = await EventEndConditionService.create(allOperatorsData);

            expect(EndConditionService.create).toHaveBeenCalledTimes(5);
            expect(result).toEqual(mockEventEndCondition);
        });
    });
}); 