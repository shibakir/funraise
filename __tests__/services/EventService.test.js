// Mock dependencies before any imports
jest.mock('../../model');
jest.mock('../../service/EventEndConditionService');
jest.mock('../../utils/media/FirebaseStorageService');
jest.mock('../../utils/achievement', () => ({
    onEventCreated: jest.fn()
}));
jest.mock('../../utils/eventCondition', () => ({
    onEventCreated: jest.fn(),
    onTimeCheck: jest.fn()
}));
jest.mock('../../constants', () => ({
    FILE_LIMITS: {
        MAX_IMAGE_SIZE: 5 * 1024 * 1024
    },
    EVENT_TYPES: {
        DONATION: 'DONATION',
        FUNDRAISING: 'FUNDRAISING',
        JACKPOT: 'JACKPOT'
    }
}));

// Import after mocks are set up
const EventService = require('../../service/EventService');
const { Event, EventEndCondition, EndCondition, Participation, User } = require('../../model');
const ApiError = require('../../exception/ApiError');
const EventEndConditionService = require('../../service/EventEndConditionService');
const { firebaseStorageService } = require('../../utils/media/FirebaseStorageService');
const { onEventCreated } = require('../../utils/achievement');
const eventConditions = require('../../utils/eventCondition');

describe('EventService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validEventData = {
            name: 'Test Event',
            description: 'Test event description',
            type: 'FUNDRAISING',
            userId: 1,
            recipientId: 2,
            imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
            eventEndConditionGroups: [
                {
                    conditions: [
                        { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                    ]
                }
            ]
        };

        it('should successfully create an event with required image', async () => {
            const eventDataWithRequiredImage = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'FUNDRAISING',
                userId: 1,
                recipientId: 2,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA', // Required field
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            const mockEvent = {
                id: 1,
                ...eventDataWithRequiredImage,
                imageUrl: 'https://firebase.com/uploaded-image.jpg'
            };

            Event.create.mockResolvedValue(mockEvent);
            EventEndConditionService.create.mockResolvedValue({
                id: 1,
                eventId: 1
            });
            firebaseStorageService.uploadImage.mockResolvedValue('https://firebase.com/uploaded-image.jpg');

            const result = await EventService.create(eventDataWithRequiredImage);

            expect(firebaseStorageService.uploadImage).toHaveBeenCalled();
            expect(Event.create).toHaveBeenCalledWith({
                name: eventDataWithRequiredImage.name,
                description: eventDataWithRequiredImage.description,
                type: eventDataWithRequiredImage.type,
                imageUrl: 'https://firebase.com/uploaded-image.jpg',
                userId: eventDataWithRequiredImage.userId,
                recipientId: eventDataWithRequiredImage.recipientId
            });

            expect(EventEndConditionService.create).toHaveBeenCalledWith({
                eventId: 1,
                conditions: eventDataWithRequiredImage.eventEndConditionGroups[0].conditions
            });

            expect(result).toEqual(mockEvent);
        });

        it('should successfully create an event with an image', async () => {
            const eventDataWithImage = {
                ...validEventData,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA'
            };

            const mockEvent = {
                id: 1,
                ...eventDataWithImage,
                imageUrl: 'https://firebase.com/image.jpg'
            };

            Event.create.mockResolvedValue(mockEvent);
            EventEndConditionService.create.mockResolvedValue({
                id: 1,
                eventId: 1
            });
            firebaseStorageService.uploadImage.mockResolvedValue('https://firebase.com/image.jpg');

            const result = await EventService.create(eventDataWithImage);

            expect(firebaseStorageService.uploadImage).toHaveBeenCalled();
            expect(Event.create).toHaveBeenCalledWith({
                name: eventDataWithImage.name,
                description: eventDataWithImage.description,
                type: eventDataWithImage.type,
                imageUrl: 'https://firebase.com/image.jpg',
                userId: eventDataWithImage.userId,
                recipientId: eventDataWithImage.recipientId
            });
            expect(result).toEqual(mockEvent);
        });

        it('should throw an error if the event end condition groups are missing', async () => {
            const invalidEventData = {
                name: 'Test Event',
                description: 'Test event description', 
                type: 'FUNDRAISING',
                userId: 1,
                recipientId: 2,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
                eventEndConditionGroups: []
            };

            await expect(EventService.create(invalidEventData))
                .rejects
                .toThrow('Event end condition groups are required');
        });

        it('should automatically set the recipientId for FUNDRAISING', async () => {
            const fundraisingEvent = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'FUNDRAISING',
                userId: 1,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            Event.create.mockResolvedValue({
                id: 1,
                ...fundraisingEvent,
                recipientId: 1
            });
            EventEndConditionService.create.mockResolvedValue({
                id: 1,
                eventId: 1
            });
            firebaseStorageService.uploadImage.mockResolvedValue('https://firebase.com/image.jpg');

            await EventService.create(fundraisingEvent);

            expect(Event.create).toHaveBeenCalledWith({
                name: fundraisingEvent.name,
                description: fundraisingEvent.description,
                type: fundraisingEvent.type,
                imageUrl: 'https://firebase.com/image.jpg',
                userId: fundraisingEvent.userId,
                recipientId: fundraisingEvent.userId // should be set as userId for FUNDRAISING
            });
        });

        it('should automatically set the recipientId for DONATION', async () => {
            const donationEvent = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'DONATION',
                userId: 1,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            Event.create.mockResolvedValue({
                id: 1,
                ...donationEvent,
                recipientId: 1
            });
            EventEndConditionService.create.mockResolvedValue({
                id: 1,
                eventId: 1
            });
            firebaseStorageService.uploadImage.mockResolvedValue('https://firebase.com/image.jpg');

            await EventService.create(donationEvent);

            expect(Event.create).toHaveBeenCalledWith({
                name: donationEvent.name,
                description: donationEvent.description,
                type: donationEvent.type,
                imageUrl: 'https://firebase.com/image.jpg',
                userId: donationEvent.userId,
                recipientId: donationEvent.userId // should be set as userId for DONATION
            });
        });

        it('should throw a validation error if imageFile is missing', async () => {
            const dataWithoutImage = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'FUNDRAISING',
                userId: 1,
                recipientId: 2,
                // imageFile is missing - should cause validation error
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            await expect(EventService.create(dataWithoutImage))
                .rejects
                .toThrow('"imageFile" is required');
        });

        it('should throw a validation error if the data is invalid', async () => {
            const invalidData = {
                name: '', // empty name
                type: 'INVALID_TYPE', 
                userId: 1,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            await expect(EventService.create(invalidData))
                .rejects
                .toThrow();
        });

        it('should throw error if image is too large', async () => {
            const largeImageData = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'FUNDRAISING',
                userId: 1,
                recipientId: 2,
                imageFile: 'data:image/jpeg;base64,' + 'A'.repeat(10 * 1024 * 1024), // 10MB
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            await expect(EventService.create(largeImageData))
                .rejects
                .toThrow('Image size must not exceed 5MB');
        });

        it('should handle firebase upload error and throw specific error', async () => {
            const eventData = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'FUNDRAISING',
                userId: 1,
                recipientId: 2,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            firebaseStorageService.uploadImage.mockRejectedValue(
                ApiError.badRequest('Firebase upload failed')
            );

            await expect(EventService.create(eventData))
                .rejects
                .toThrow('Firebase upload failed');
        });

        it('should handle firebase upload error and wrap generic error', async () => {
            const eventData = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'FUNDRAISING',
                userId: 1,
                recipientId: 2,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            firebaseStorageService.uploadImage.mockRejectedValue(
                new Error('Generic error')
            );

            await expect(EventService.create(eventData))
                .rejects
                .toThrow('Failed to upload image: Generic error');
        });

        it('should handle creation errors gracefully', async () => {
            const eventData = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'FUNDRAISING',
                userId: 1,
                recipientId: 2,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            Event.create.mockRejectedValue(new Error('Database error'));
            firebaseStorageService.uploadImage.mockResolvedValue('https://firebase.com/image.jpg');

            await expect(EventService.create(eventData))
                .rejects
                .toThrow('Database error');
        });

        it('should call achievement tracking and event condition initialization', async () => {
            const eventData = {
                name: 'Test Event',
                description: 'Test event description',
                type: 'FUNDRAISING',
                userId: 1,
                recipientId: 2,
                imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
                eventEndConditionGroups: [
                    {
                        conditions: [
                            { name: 'AMOUNT', operator: 'GREATER_EQUALS', value: '1000' }
                        ]
                    }
                ]
            };

            const mockEvent = { id: 1, ...eventData };

            Event.create.mockResolvedValue(mockEvent);
            EventEndConditionService.create.mockResolvedValue({
                id: 1,
                eventId: 1
            });
            firebaseStorageService.uploadImage.mockResolvedValue('https://firebase.com/image.jpg');

            await EventService.create(eventData);

            expect(onEventCreated).toHaveBeenCalledWith(1, 1);
            expect(eventConditions.onEventCreated).toHaveBeenCalledWith(1);
        });
    });

    describe('findById', () => {
        it('should find an event by ID with end conditions', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                endConditions: [
                    {
                        id: 1,
                        conditions: [
                            { id: 1, name: 'AMOUNT', operator: 'gte', value: 1000 }
                        ]
                    }
                ]
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventService.findById(1, true);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    {
                        model: EventEndCondition,
                        as: 'endConditions',
                        include: [{
                            model: EndCondition,
                            as: 'conditions'
                        }]
                    }
                ]
            });
            expect(result).toEqual(mockEvent);
        });

        it('should find an event by ID without end conditions', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event'
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventService.findById(1, false);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: []
            });
            expect(result).toEqual(mockEvent);
        });

        it('should throw an error if the event is not found', async () => {
            Event.findByPk.mockResolvedValue(null);

            await expect(EventService.findById(999))
                .rejects
                .toThrow('Event not found');
        });

        it('should handle database errors', async () => {
            Event.findByPk.mockRejectedValue(new Error('Database error'));

            await expect(EventService.findById(1))
                .rejects
                .toThrow('Error finding event by ID');
        });
    });

    describe('findAll', () => {
        it('should find all events with end conditions', async () => {
            const mockEvents = [
                {
                    id: 1,
                    name: 'Event 1',
                    endConditions: []
                },
                {
                    id: 2,
                    name: 'Event 2',
                    endConditions: []
                }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            const result = await EventService.findAll(true);

            expect(Event.findAll).toHaveBeenCalledWith({
                include: [
                    {
                        model: EventEndCondition,
                        as: 'endConditions',
                        include: [{
                            model: EndCondition,
                            as: 'conditions'
                        }]
                    }
                ]
            });
            expect(result).toEqual(mockEvents);
        });

        it('should find all events without end conditions', async () => {
            const mockEvents = [
                { id: 1, name: 'Event 1' },
                { id: 2, name: 'Event 2' }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            const result = await EventService.findAll(false);

            expect(Event.findAll).toHaveBeenCalledWith({
                include: []
            });
            expect(result).toEqual(mockEvents);
        });

        it('should handle database errors in findAll', async () => {
            Event.findAll.mockRejectedValue(new Error('Database error'));

            await expect(EventService.findAll())
                .rejects
                .toThrow('Error finding all events');
        });
    });

    describe('calculateBankAmount', () => {
        it('should calculate the total bank amount of an event', async () => {
            const mockParticipations = [
                { deposit: 100 },
                { deposit: 200 },
                { deposit: 150 }
            ];

            Participation.findAll.mockResolvedValue(mockParticipations);

            const result = await EventService.calculateBankAmount(1);

            expect(Participation.findAll).toHaveBeenCalledWith({
                where: { eventId: 1 },
                attributes: ['deposit']
            });
            expect(result).toBe(450);
        });

        it('should return 0 if no participations exist', async () => {
            Participation.findAll.mockResolvedValue([]);

            const result = await EventService.calculateBankAmount(1);

            expect(result).toBe(0);
        });

        it('should handle null deposit values', async () => {
            const mockParticipations = [
                { deposit: 100 },
                { deposit: null },
                { deposit: 200 }
            ];

            Participation.findAll.mockResolvedValue(mockParticipations);

            const result = await EventService.calculateBankAmount(1);

            expect(result).toBe(300);
        });

        it('should handle database errors in calculateBankAmount', async () => {
            Participation.findAll.mockRejectedValue(new Error('Database error'));

            await expect(EventService.calculateBankAmount(1))
                .rejects
                .toThrow('Error calculating bank amount');
        });
    });

    describe('updateStatus', () => {
        it('should successfully update the event status', async () => {
            Event.update.mockResolvedValue([1]);

            const result = await EventService.updateStatus(1, 'COMPLETED');

            expect(Event.update).toHaveBeenCalledWith(
                { status: 'COMPLETED' },
                { where: { id: 1 } }
            );
            expect(result).toEqual([1]);
        });

        it('should handle database errors in updateStatus', async () => {
            Event.update.mockRejectedValue(new Error('Database error'));

            await expect(EventService.updateStatus(1, 'COMPLETED'))
                .rejects
                .toThrow('Error updating event status');
        });
    });

    describe('findByUser', () => {
        it('should find events of a user with a limit', async () => {
            const mockEvents = [
                { id: 1, name: 'Event 1', userId: 1 },
                { id: 2, name: 'Event 2', userId: 1 }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            const result = await EventService.findByUser(1, 10);

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                order: [['createdAt', 'DESC']],
                limit: 10
            });
            expect(result).toEqual(mockEvents);
        });

        it('should use the default limit', async () => {
            Event.findAll.mockResolvedValue([]);

            await EventService.findByUser(1);

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                order: [['createdAt', 'DESC']],
                limit: 30
            });
        });

        it('should handle database errors in findByUser', async () => {
            Event.findAll.mockRejectedValue(new Error('Database error'));

            await expect(EventService.findByUser(1))
                .rejects
                .toThrow('Error finding events by user');
        });
    });

    describe('checkTimeConditions', () => {
        it('should check time conditions for active events', async () => {
            const mockEvents = [
                {
                    id: 1,
                    status: 'IN_PROGRESS',
                    endConditions: [
                        {
                            conditions: [
                                { name: 'TIME', value: '2024-01-01' }
                            ]
                        }
                    ]
                }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            await EventService.checkTimeConditions();

            expect(Event.findAll).toHaveBeenCalledWith({
                where: { status: 'IN_PROGRESS' },
                include: [{
                    model: EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: EndCondition,
                        as: 'conditions',
                        where: { name: 'TIME' },
                        required: false
                    }]
                }]
            });
            expect(eventConditions.onTimeCheck).toHaveBeenCalledWith(1);
        });

        it('should skip events without time conditions', async () => {
            const mockEvents = [
                {
                    id: 1,
                    status: 'IN_PROGRESS',
                    endConditions: [
                        {
                            conditions: [
                                { name: 'BANK', value: '1000' }
                            ]
                        }
                    ]
                }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            await EventService.checkTimeConditions();

            expect(eventConditions.onTimeCheck).not.toHaveBeenCalled();
        });

        it('should skip events without endConditions', async () => {
            const mockEvents = [
                {
                    id: 1,
                    status: 'IN_PROGRESS',
                    endConditions: []
                }
            ];

            Event.findAll.mockResolvedValue(mockEvents);

            await EventService.checkTimeConditions();

            expect(eventConditions.onTimeCheck).not.toHaveBeenCalled();
        });

        it('should handle database errors in checkTimeConditions', async () => {
            Event.findAll.mockRejectedValue(new Error('Database error'));

            await expect(EventService.checkTimeConditions())
                .rejects
                .toThrow('Error checking time conditions');
        });
    });

    describe('findByIdWithParticipants', () => {
        it('should find an event with participants', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                participations: [
                    {
                        id: 1,
                        deposit: 100,
                        user: { id: 1, balance: 500 }
                    }
                ]
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventService.findByIdWithParticipants(1);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [{
                    model: Participation,
                    as: 'participations',
                    include: [{
                        model: require('../../model').User,
                        as: 'user',
                        attributes: ['id', 'balance']
                    }]
                }]
            });
            expect(result).toEqual(mockEvent);
        });

        it('should handle database errors in findByIdWithParticipants', async () => {
            Event.findByPk.mockRejectedValue(new Error('Database error'));

            await expect(EventService.findByIdWithParticipants(1))
                .rejects
                .toThrow('Error finding event with participants');
        });
    });

    describe('findByIdWithEndConditions', () => {
        it('should find an event with end conditions', async () => {
            const mockEvent = {
                id: 1,
                name: 'Test Event',
                endConditions: [
                    {
                        id: 1,
                        conditions: []
                    }
                ]
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventService.findByIdWithEndConditions(1);

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

        it('should handle database errors in findByIdWithEndConditions', async () => {
            Event.findByPk.mockRejectedValue(new Error('Database error'));

            await expect(EventService.findByIdWithEndConditions(1))
                .rejects
                .toThrow('Error finding event with end conditions');
        });
    });

    describe('findCreator', () => {
        it('should find event creator', async () => {
            const mockEvent = {
                id: 1,
                creator: { id: 1, username: 'test' }
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventService.findCreator(1);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [{
                    model: User,
                    as: 'creator'
                }]
            });
            expect(result).toEqual(mockEvent.creator);
        });

        it('should return null if event not found', async () => {
            Event.findByPk.mockResolvedValue(null);

            const result = await EventService.findCreator(1);

            expect(result).toBeNull();
        });

        it('should handle database errors in findCreator', async () => {
            Event.findByPk.mockRejectedValue(new Error('Database error'));

            await expect(EventService.findCreator(1))
                .rejects
                .toThrow('Error finding event creator');
        });
    });

    describe('findRecipient', () => {
        it('should find event recipient', async () => {
            const mockEvent = {
                id: 1,
                recipient: { id: 2, username: 'recipient' }
            };

            Event.findByPk.mockResolvedValue(mockEvent);

            const result = await EventService.findRecipient(1);

            expect(Event.findByPk).toHaveBeenCalledWith(1, {
                include: [{
                    model: User,
                    as: 'recipient'
                }]
            });
            expect(result).toEqual(mockEvent.recipient);
        });

        it('should return null if event not found', async () => {
            Event.findByPk.mockResolvedValue(null);

            const result = await EventService.findRecipient(1);

            expect(result).toBeNull();
        });

        it('should handle database errors in findRecipient', async () => {
            Event.findByPk.mockRejectedValue(new Error('Database error'));

            await expect(EventService.findRecipient(1))
                .rejects
                .toThrow('Error finding event recipient');
        });
    });

    describe('findParticipations', () => {
        it('should find event participations', async () => {
            const mockParticipations = [
                {
                    id: 1,
                    eventId: 1,
                    user: { id: 1, username: 'user1' }
                },
                {
                    id: 2,
                    eventId: 1,
                    user: { id: 2, username: 'user2' }
                }
            ];

            Participation.findAll.mockResolvedValue(mockParticipations);

            const result = await EventService.findParticipations(1);

            expect(Participation.findAll).toHaveBeenCalledWith({
                where: { eventId: 1 },
                include: [
                    { model: User, as: 'user' }
                ]
            });
            expect(result).toEqual(mockParticipations);
        });

        it('should handle database errors in findParticipations', async () => {
            Participation.findAll.mockRejectedValue(new Error('Database error'));

            await expect(EventService.findParticipations(1))
                .rejects
                .toThrow('Error finding event participations');
        });
    });
}); 
