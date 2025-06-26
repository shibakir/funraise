const ParticipationService = require('../../service/ParticipationService');
const { ParticipationRepository } = require('../../repository');
const ApiError = require('../../exception/ApiError');
const EventCompletionTracker = require('../../utils/achievement/EventCompletionTracker');

// Mock dependencies
jest.mock('../../repository', () => ({
    ParticipationRepository: {
        create: jest.fn(),
        findByUserAndEvent: jest.fn(),
        findByIdWithAssociations: jest.fn(),
        findByUser: jest.fn(),
        findByEvent: jest.fn(),
        update: jest.fn()
    }
}));
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

            ParticipationRepository.create.mockResolvedValue(mockParticipation);
            EventCompletionTracker.handleEventParticipation.mockResolvedValue();

            const result = await ParticipationService.create(validParticipationData);

            expect(ParticipationRepository.create).toHaveBeenCalledWith({
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

            ParticipationRepository.findByUserAndEvent.mockResolvedValue(mockParticipation);

            const result = await ParticipationService.findByUserAndEvent(1, 1);

            expect(ParticipationRepository.findByUserAndEvent).toHaveBeenCalledWith(1, 1);
            expect(result).toEqual(mockParticipation);
        });

        it('should return null if the participation is not found', async () => {
            ParticipationRepository.findByUserAndEvent.mockResolvedValue(null);

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

            ParticipationRepository.findByIdWithAssociations.mockResolvedValue(mockParticipation);

            const result = await ParticipationService.findById(1);

            expect(ParticipationRepository.findByIdWithAssociations).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockParticipation);
        });

        it('should handle database errors when finding by ID', async () => {
            const dbError = new Error('Database error');
            ParticipationRepository.findByIdWithAssociations.mockRejectedValue(dbError);

            await expect(ParticipationService.findById(999))
                .rejects
                .toThrow('Error finding participation by ID');
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

            ParticipationRepository.findByUser.mockResolvedValue(mockParticipations);

            const result = await ParticipationService.findByUser(1);

            expect(ParticipationRepository.findByUser).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockParticipations);
        });

        it('should return an empty array if the user has no participations', async () => {
            ParticipationRepository.findByUser.mockResolvedValue([]);

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

            ParticipationRepository.findByEvent.mockResolvedValue(mockParticipations);

            const result = await ParticipationService.findByEvent(1);

            expect(ParticipationRepository.findByEvent).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockParticipations);
        });

        it('should return an empty array if the event has no participations', async () => {
            ParticipationRepository.findByEvent.mockResolvedValue([]);

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

            ParticipationRepository.update.mockResolvedValue([1]); // number of updated records
            // Mock the findById method that's called inside update
            const findByIdSpy = jest.spyOn(ParticipationService, 'findById')
                .mockResolvedValue(updatedParticipation);

            const result = await ParticipationService.update(1, updateData);

            expect(ParticipationRepository.update).toHaveBeenCalledWith(1, updateData);
            expect(result).toEqual(updatedParticipation);

            findByIdSpy.mockRestore();
        });

        it('should handle database errors when updating', async () => {
            const dbError = new Error('Database error');
            ParticipationRepository.update.mockRejectedValue(dbError);

            await expect(ParticipationService.update(1, { deposit: 150 }))
                .rejects
                .toThrow('Error updating participation');
        });
    });

    describe('error handling', () => {
        it('should handle database errors in findByUserAndEvent', async () => {
            const dbError = new Error('Database connection error');
            ParticipationRepository.findByUserAndEvent.mockRejectedValue(dbError);

            await expect(ParticipationService.findByUserAndEvent(1, 1))
                .rejects
                .toThrow('Error finding participation by user and event');
        });

        it('should handle database errors in findByUser', async () => {
            const dbError = new Error('Database connection error');
            ParticipationRepository.findByUser.mockRejectedValue(dbError);

            await expect(ParticipationService.findByUser(1))
                .rejects
                .toThrow('Error finding participations by user');
        });

        it('should handle database errors in findByEvent', async () => {
            const dbError = new Error('Database connection error');
            ParticipationRepository.findByEvent.mockRejectedValue(dbError);

            await expect(ParticipationService.findByEvent(1))
                .rejects
                .toThrow('Error finding participations by event');
        });

        it('should handle errors when creating a participation', async () => {
            const dbError = new Error('Database constraint violation');
            ParticipationRepository.create.mockRejectedValue(dbError);

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

            ParticipationRepository.create.mockResolvedValue({ id: 1, ...participationData });
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

            ParticipationRepository.create.mockResolvedValue({ id: 1, ...participationData });
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