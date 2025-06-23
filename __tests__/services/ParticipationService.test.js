const ParticipationService = require('../../service/ParticipationService');
const { Participation, User, Event } = require('../../model');
const ApiError = require('../../exception/ApiError');
const EventCompletionTracker = require('../../utils/achievement/EventCompletionTracker');

// Mock dependencies
jest.mock('../../model');
jest.mock('../../utils/achievement/EventCompletionTracker');
jest.mock('../../utils/eventCondition', () => ({
    onParticipationAdded: jest.fn().mockResolvedValue(),
    onParticipationUpdated: jest.fn().mockResolvedValue(),
    onEventCreated: jest.fn().mockResolvedValue(),
    onTimeCheck: jest.fn().mockResolvedValue()
}));

// Import the mocked eventCondition after mocking
const eventConditions = require('../../utils/eventCondition');

describe('ParticipationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validParticipationData = {
            deposit: 100,
            userId: 1,
            eventId: 1
        };

        it('should successfully create a participation', async () => {
            const mockParticipation = {
                id: 1,
                ...validParticipationData
            };

            Participation.create.mockResolvedValue(mockParticipation);
            EventCompletionTracker.handleEventParticipation.mockResolvedValue();

            const result = await ParticipationService.create(validParticipationData);

            expect(Participation.create).toHaveBeenCalledWith({
                deposit: validParticipationData.deposit,
                userId: validParticipationData.userId,
                eventId: validParticipationData.eventId
            });

            expect(EventCompletionTracker.handleEventParticipation).toHaveBeenCalledWith(
                validParticipationData.userId,
                validParticipationData.eventId,
                validParticipationData.deposit
            );

            expect(eventConditions.onParticipationAdded).toHaveBeenCalledWith(
                validParticipationData.eventId,
                validParticipationData.userId,
                validParticipationData.deposit
            );

            expect(result).toEqual(mockParticipation);
        });

        it('should throw a validation error if the data is invalid', async () => {
            const invalidData = {
                deposit: 'invalid', // should be a number
                userId: 1,
                eventId: 1
            };

            // Validation should fail before any database operations
            await expect(ParticipationService.create(invalidData))
                .rejects
                .toThrow('must be a number');
                
            // Ensure no database operations were attempted
            expect(Participation.create).not.toHaveBeenCalled();
        });

        it('should throw an error if the required fields are missing', async () => {
            const incompleteData = {
                deposit: 100
                // userId and eventId are missing
            };

            await expect(ParticipationService.create(incompleteData))
                .rejects
                .toThrow('is required');
                
            // Ensure no database operations were attempted
            expect(Participation.create).not.toHaveBeenCalled();
        });
    });

    describe('findByUserAndEvent', () => {
        it('should find a participation by user and event', async () => {
            const mockParticipation = {
                id: 1,
                userId: 1,
                eventId: 1,
                deposit: 100,
                user: { id: 1, username: 'testuser' },
                event: { id: 1, name: 'Test Event' }
            };

            Participation.findOne.mockResolvedValue(mockParticipation);

            const result = await ParticipationService.findByUserAndEvent(1, 1);

            expect(Participation.findOne).toHaveBeenCalledWith({
                where: { userId: 1, eventId: 1 },
                include: [
                    { model: User, as: 'user' },
                    { model: Event, as: 'event' }
                ]
            });
            expect(result).toEqual(mockParticipation);
        });

        it('should return null if the participation is not found', async () => {
            Participation.findOne.mockResolvedValue(null);

            const result = await ParticipationService.findByUserAndEvent(999, 999);

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should find a participation by ID', async () => {
            const mockParticipation = {
                id: 1,
                userId: 1,
                eventId: 1,
                deposit: 100,
                user: { id: 1, username: 'testuser' },
                event: { id: 1, name: 'Test Event' }
            };

            Participation.findByPk.mockResolvedValue(mockParticipation);

            const result = await ParticipationService.findById(1);

            expect(Participation.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    { model: User, as: 'user' },
                    { model: Event, as: 'event' }
                ]
            });
            expect(result).toEqual(mockParticipation);
        });

        it('should throw an error if the participation is not found', async () => {
            Participation.findByPk.mockResolvedValue(null);

            await expect(ParticipationService.findById(999))
                .rejects
                .toThrow('Participation not found');
        });
    });

    describe('findByUser', () => {
        it('should find all participations of a user', async () => {
            const mockParticipations = [
                {
                    id: 1,
                    userId: 1,
                    eventId: 1,
                    deposit: 100,
                    event: { id: 1, name: 'Event 1' }
                },
                {
                    id: 2,
                    userId: 1,
                    eventId: 2,
                    deposit: 200,
                    event: { id: 2, name: 'Event 2' }
                }
            ];

            Participation.findAll.mockResolvedValue(mockParticipations);

            const result = await ParticipationService.findByUser(1);

            expect(Participation.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                include: [
                    { model: Event, as: 'event' }
                ]
            });
            expect(result).toEqual(mockParticipations);
        });

        it('should return an empty array if the user has no participations', async () => {
            Participation.findAll.mockResolvedValue([]);

            const result = await ParticipationService.findByUser(999);

            expect(result).toEqual([]);
        });
    });

    describe('findByEvent', () => {
        it('should find all participations of an event', async () => {
            const mockParticipations = [
                {
                    id: 1,
                    userId: 1,
                    eventId: 1,
                    deposit: 100,
                    user: { id: 1, username: 'user1' }
                },
                {
                    id: 2,
                    userId: 2,
                    eventId: 1,
                    deposit: 200,
                    user: { id: 2, username: 'user2' }
                }
            ];

            Participation.findAll.mockResolvedValue(mockParticipations);

            const result = await ParticipationService.findByEvent(1);

            expect(Participation.findAll).toHaveBeenCalledWith({
                where: { eventId: 1 },
                include: [
                    { model: User, as: 'user' }
                ]
            });
            expect(result).toEqual(mockParticipations);
        });

        it('should return an empty array if the event has no participations', async () => {
            Participation.findAll.mockResolvedValue([]);

            const result = await ParticipationService.findByEvent(999);

            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('should successfully update a participation', async () => {
            const updateData = {
                deposit: 150
            };

            const updatedParticipation = {
                id: 1,
                userId: 1,
                eventId: 1,
                deposit: 150,
                user: { id: 1, username: 'testuser' },
                event: { id: 1, name: 'Test Event' }
            };

            Participation.update.mockResolvedValue([1]); // number of updated records
            Participation.findByPk.mockResolvedValue(updatedParticipation);

            const result = await ParticipationService.update(1, updateData);

            expect(Participation.update).toHaveBeenCalledWith(updateData, {
                where: { id: 1 }
            });
            expect(Participation.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    { model: User, as: 'user' },
                    { model: Event, as: 'event' }
                ]
            });
            expect(result).toEqual(updatedParticipation);
        });

        it('should throw an error if the participation is not found for update', async () => {
            Participation.update.mockResolvedValue([0]); // no records found for update

            await expect(ParticipationService.update(999, { deposit: 150 }))
                .rejects
                .toThrow('Participation not found');
        });

        it('should handle database errors when updating', async () => {
            const dbError = new Error('Database error');
            Participation.update.mockRejectedValue(dbError);

            await expect(ParticipationService.update(1, { deposit: 150 }))
                .rejects
                .toThrow('Error updating participation');
        });
    });

    describe('error handling', () => {
        it('should handle database errors in findByUserAndEvent', async () => {
            const dbError = new Error('Database connection error');
            Participation.findOne.mockRejectedValue(dbError);

            await expect(ParticipationService.findByUserAndEvent(1, 1))
                .rejects
                .toThrow('Error finding participation by user and event');
        });

        it('should handle database errors in findByUser', async () => {
            const dbError = new Error('Database connection error');
            Participation.findAll.mockRejectedValue(dbError);

            await expect(ParticipationService.findByUser(1))
                .rejects
                .toThrow('Error finding participations by user');
        });

        it('should handle database errors in findByEvent', async () => {
            const dbError = new Error('Database connection error');
            Participation.findAll.mockRejectedValue(dbError);

            await expect(ParticipationService.findByEvent(1))
                .rejects
                .toThrow('Error finding participations by event');
        });

        it('should handle errors when creating a participation', async () => {
            const dbError = new Error('Database constraint violation');
            Participation.create.mockRejectedValue(dbError);

            await expect(ParticipationService.create({
                deposit: 100,
                userId: 1,
                eventId: 1
            })).rejects.toThrow('Database constraint violation');
        });
    });

    describe('integration with achievement system', () => {
        it('should call the achievement tracker when creating a participation', async () => {
            const participationData = {
                deposit: 100,
                userId: 1,
                eventId: 1
            };

            Participation.create.mockResolvedValue({ id: 1, ...participationData });
            EventCompletionTracker.handleEventParticipation.mockResolvedValue();

            await ParticipationService.create(participationData);

            expect(EventCompletionTracker.handleEventParticipation).toHaveBeenCalledWith(
                participationData.userId,
                participationData.eventId,
                participationData.deposit
            );
        });

        it('should call the event conditions checker when creating a participation', async () => {
            const participationData = {
                deposit: 100,
                userId: 1,
                eventId: 1
            };

            Participation.create.mockResolvedValue({ id: 1, ...participationData });
            EventCompletionTracker.handleEventParticipation.mockResolvedValue();

            await ParticipationService.create(participationData);

            expect(eventConditions.onParticipationAdded).toHaveBeenCalledWith(
                participationData.eventId,
                participationData.userId,
                participationData.deposit
            );
        });
    });
}); 