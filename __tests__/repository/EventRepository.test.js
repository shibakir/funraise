const EventRepository = require('../../repository/EventRepository');
const BaseRepository = require('../../repository/BaseRepository');
const { Event, EventEndCondition, EndCondition, Participation, User } = require('../../model');
const { EVENT_STATUSES, CONDITION_TYPES } = require('../../constants');
const ApiError = require('../../exception/ApiError');

// Mock models
jest.mock('../../model');

describe('EventRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('inheritance', () => {
        it('should extend BaseRepository', () => {
            expect(EventRepository).toBeInstanceOf(BaseRepository);
            expect(EventRepository.model).toBe(Event);
        });
    });

    describe('findByIdWithParticipants', () => {
        it('should find event by ID with participants and users', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                participations: [
                    {
                        id: 1,
                        userId: 1,
                        deposit: 100,
                        user: { id: 1, balance: 500 }
                    },
                    {
                        id: 2,
                        userId: 2,
                        deposit: 200,
                        user: { id: 2, balance: 1000 }
                    }
                ]
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findByIdWithParticipants(1);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    {
                        model: Participation,
                        as: 'participations',
                        include: [{ 
                            model: User, 
                            as: 'user',
                            attributes: ['id', 'balance'] 
                        }]
                    }
                ]
            });
            expect(result).toEqual(mockEvent);
        });

        it('should throw ApiError if event not found', async () => {
            Event.findByPk.mockResolvedValue(null);

            await expect(EventRepository.findByIdWithParticipants(999))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Event.findByPk.mockRejectedValue(dbError);

            await expect(EventRepository.findByIdWithParticipants(1))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle event with no participants', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                participations: []
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findByIdWithParticipants(1);

            expect(result.participations).toEqual([]);
        });
    });

    describe('findByUser', () => {
        it('should find events by user ID with default limit', async () => {
            const mockEvents = [
                { id: 1, name: 'Event 1', userId: 1 },
                { id: 2, name: 'Event 2', userId: 1 }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            const result = await EventRepository.findByUser(1);

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                order: [['createdAt', 'DESC']],
                limit: 30
            });
            expect(result).toEqual(mockEvents);
        });

        it('should find events by user ID with custom limit', async () => {
            const mockEvents = [{ id: 1, name: 'Event 1', userId: 1 }];
            Event.findAll.mockResolvedValue(mockEvents);

            const result = await EventRepository.findByUser(1, 10);

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                order: [['createdAt', 'DESC']],
                limit: 10
            });
            expect(result).toEqual(mockEvents);
        });

        it('should return empty array if no events found', async () => {
            Event.findAll.mockResolvedValue([]);

            const result = await EventRepository.findByUser(999);

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Event.findAll.mockRejectedValue(dbError);

            await expect(EventRepository.findByUser(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findByIdWithEndConditions', () => {
        it('should find event by ID with end conditions', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                endConditions: [
                    {
                        id: 1,
                        eventId: 1,
                        conditions: [
                            { id: 1, name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findByIdWithEndConditions(1);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [{
                    model: EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: EndCondition,
                        as: 'conditions'
                    }]
                }]
            });
            expect(result).toEqual(mockEvent);
        });

        it('should throw ApiError if event not found', async () => {
            Event.findByPk.mockResolvedValue(null);

            await expect(EventRepository.findByIdWithEndConditions(999))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Event.findByPk.mockRejectedValue(dbError);

            await expect(EventRepository.findByIdWithEndConditions(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findByIdWithOptionalEndConditions', () => {
        it('should find event with end conditions when includeEndConditions is true', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                endConditions: []
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findByIdWithOptionalEndConditions(1, true);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [{
                    model: EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: EndCondition,
                        as: 'conditions'
                    }]
                }]
            });
            expect(result).toEqual(mockEvent);
        });

        it('should find event without end conditions when includeEndConditions is false', async () => {
            const mockEvent = { id: 1, name: 'Test Event' };
            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findByIdWithOptionalEndConditions(1, false);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: []
            });
            expect(result).toEqual(mockEvent);
        });

        it('should include end conditions by default', async () => {
            const mockEvent = { id: 1, name: 'Test Event', endConditions: [] };
            Event.findByPk.mockResolvedValue(mockEvent);

            await EventRepository.findByIdWithOptionalEndConditions(1);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [{
                    model: EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: EndCondition,
                        as: 'conditions'
                    }]
                }]
            });
        });

        it('should throw ApiError if event not found', async () => {
            Event.findByPk.mockResolvedValue(null);

            await expect(EventRepository.findByIdWithOptionalEndConditions(999))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findAllWithOptionalEndConditions', () => {
        it('should find all events with end conditions when includeEndConditions is true', async () => {
            const mockEvents = [
                { id: 1, name: 'Event 1', endConditions: [] },
                { id: 2, name: 'Event 2', endConditions: [] }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            const result = await EventRepository.findAllWithOptionalEndConditions(true);

            expect(Event.findAll).toHaveBeenCalledWith({
                include: [{
                    model: EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: EndCondition,
                        as: 'conditions'
                    }]
                }]
            });
            expect(result).toEqual(mockEvents);
        });

        it('should find all events without end conditions when includeEndConditions is false', async () => {
            const mockEvents = [
                { id: 1, name: 'Event 1' },
                { id: 2, name: 'Event 2' }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            const result = await EventRepository.findAllWithOptionalEndConditions(false);

            expect(Event.findAll).toHaveBeenCalledWith({
                include: []
            });
            expect(result).toEqual(mockEvents);
        });

        it('should include end conditions by default', async () => {
            const mockEvents = [{ id: 1, name: 'Event 1', endConditions: [] }];
            Event.findAll.mockResolvedValue(mockEvents);

            await EventRepository.findAllWithOptionalEndConditions();

            expect(Event.findAll).toHaveBeenCalledWith({
                include: [{
                    model: EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: EndCondition,
                        as: 'conditions'
                    }]
                }]
            });
        });

        it('should return empty array if no events found', async () => {
            Event.findAll.mockResolvedValue([]);

            const result = await EventRepository.findAllWithOptionalEndConditions();

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Event.findAll.mockRejectedValue(dbError);

            await expect(EventRepository.findAllWithOptionalEndConditions())
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findCreator', () => {
        it('should find event creator', async () => {
            const mockEvent = {
                id: 1,
                userId: 123,
                creator: { id: 123, username: 'creator' }
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findCreator(1);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [{ 
                    model: User, 
                    as: 'creator' 
                }]
            });
            expect(result).toEqual(mockEvent.creator);
        });

        it('should throw ApiError if event not found', async () => {
            Event.findByPk.mockResolvedValue(null);

            await expect(EventRepository.findCreator(999))
                .rejects
                .toThrow(ApiError);
        });

        it('should return null if event found but no creator', async () => {
            const mockEvent = { id: 1, creator: null };
            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findCreator(1);

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Event.findByPk.mockRejectedValue(dbError);

            await expect(EventRepository.findCreator(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findRecipient', () => {
        it('should find event recipient', async () => {
            const mockEvent = {
                id: 1,
                recipientId: 456,
                recipient: { id: 456, username: 'recipient' }
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findRecipient(1);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [{ 
                    model: User, 
                    as: 'recipient' 
                }]
            });
            expect(result).toEqual(mockEvent.recipient);
        });

        it('should throw ApiError if event not found', async () => {
            Event.findByPk.mockResolvedValue(null);

            await expect(EventRepository.findRecipient(999))
                .rejects
                .toThrow(ApiError);
        });

        it('should return null if event found but no recipient', async () => {
            const mockEvent = { id: 1, recipient: null };
            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findRecipient(1);

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Event.findByPk.mockRejectedValue(dbError);

            await expect(EventRepository.findRecipient(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findActiveEvents', () => {
        it('should find active events with time conditions', async () => {
            const mockEvents = [
                {
                    id: 1,
                    status: 'IN_PROGRESS',
                    endConditions: [
                        {
                            id: 1,
                            conditions: [
                                { id: 1, name: 'TIME', value: '2024-12-31' }
                            ]
                        }
                    ]
                }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            const result = await EventRepository.findActiveEvents();

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { 
                    status: EVENT_STATUSES.IN_PROGRESS 
                },
                include: [{
                    model: EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: EndCondition,
                        as: 'conditions',
                        where: {
                            name: CONDITION_TYPES.TIME
                        },
                        required: false
                    }]
                }]
            });
            expect(result).toEqual(mockEvents);
        });

        it('should return empty array if no active events found', async () => {
            Event.findAll.mockResolvedValue([]);

            const result = await EventRepository.findActiveEvents();

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Event.findAll.mockRejectedValue(dbError);

            await expect(EventRepository.findActiveEvents())
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('updateStatus', () => {
        it('should update event status', async () => {
            const updateResult = [1]; // One record updated
            Event.update.mockResolvedValue(updateResult);

            const result = await EventRepository.updateStatus(1, 'COMPLETED');

            expect(Event.update).toHaveBeenCalledWith(
                { status: 'COMPLETED' },
                { where: { id: 1 } }
            );
            expect(result).toEqual(updateResult);
        });

        it('should handle different status values', async () => {
            const statuses = ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'];
            Event.update.mockResolvedValue([1]);

            for (const status of statuses) {
                await EventRepository.updateStatus(1, status);
                
                expect(Event.update).toHaveBeenCalledWith(
                    { status: status },
                    { where: { id: 1 } }
                );
            }
        });

        it('should throw ApiError if event not found', async () => {
            Event.update.mockResolvedValue([0]); // No records updated

            await expect(EventRepository.updateStatus(999, 'COMPLETED'))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Event.update.mockRejectedValue(dbError);

            await expect(EventRepository.updateStatus(1, 'COMPLETED'))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle null user ID in findByUser', async () => {
            Event.findAll.mockResolvedValue([]);

            await EventRepository.findByUser(null);

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { userId: null },
                order: [['createdAt', 'DESC']],
                limit: 30
            });
        });

        it('should handle zero limit in findByUser', async () => {
            Event.findAll.mockResolvedValue([]);

            await EventRepository.findByUser(1, 0);

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                order: [['createdAt', 'DESC']],
                limit: 0
            });
        });

        it('should handle very large limit in findByUser', async () => {
            Event.findAll.mockResolvedValue([]);

            await EventRepository.findByUser(1, 10000);

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                order: [['createdAt', 'DESC']],
                limit: 10000
            });
        });

        it('should handle empty status string in updateStatus', async () => {
            Event.update.mockResolvedValue([1]);

            await EventRepository.updateStatus(1, '');

            expect(Event.update).toHaveBeenCalledWith(
                { status: '' },
                { where: { id: 1 } }
            );
        });

        it('should handle null status in updateStatus', async () => {
            Event.update.mockResolvedValue([1]);

            await EventRepository.updateStatus(1, null);

            expect(Event.update).toHaveBeenCalledWith(
                { status: null },
                { where: { id: 1 } }
            );
        });
    });

    describe('data consistency', () => {
        it('should maintain correct data structure in findByIdWithParticipants', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                type: 'FUNDRAISING',
                status: 'IN_PROGRESS',
                participations: [
                    {
                        id: 1,
                        userId: 1,
                        eventId: 1,
                        deposit: 100,
                        user: { id: 1, balance: 500 }
                    }
                ]
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findByIdWithParticipants(1);

            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('name', 'Test Event');
            expect(result).toHaveProperty('type', 'FUNDRAISING');
            expect(result).toHaveProperty('status', 'IN_PROGRESS');
            expect(result).toHaveProperty('participations');
            expect(Array.isArray(result.participations)).toBe(true);
            expect(result.participations[0]).toHaveProperty('user');
            expect(result.participations[0].user).toHaveProperty('id', 1);
            expect(result.participations[0].user).toHaveProperty('balance', 500);
        });

        it('should maintain correct data structure in findByIdWithEndConditions', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                endConditions: [
                    {
                        id: 1,
                        eventId: 1,
                        isCompleted: false,
                        conditions: [
                            { id: 1, name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventRepository.findByIdWithEndConditions(1);

            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('endConditions');
            expect(Array.isArray(result.endConditions)).toBe(true);
            expect(result.endConditions[0]).toHaveProperty('conditions');
            expect(Array.isArray(result.endConditions[0].conditions)).toBe(true);
            expect(result.endConditions[0].conditions[0]).toHaveProperty('name', 'AMOUNT');
            expect(result.endConditions[0].conditions[0]).toHaveProperty('operator', 'GREATER_EQUALS');
            expect(result.endConditions[0].conditions[0]).toHaveProperty('value', '1000');
        });
    });
}); 