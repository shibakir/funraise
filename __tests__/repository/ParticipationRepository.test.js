const ParticipationRepository = require('../../repository/ParticipationRepository');
const { Participation, User, Event } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  Participation: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'Participation'
  },
  User: {},
  Event: {}
}));

describe('ParticipationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserAndEvent', () => {
    it('should find participation by user and event with associations', async () => {
      const mockParticipation = {
        id: 1,
        userId: 1,
        eventId: 1,
        deposit: 100,
        user: { id: 1, username: 'test' },
        event: { id: 1, title: 'Test Event' }
      };
      Participation.findOne.mockResolvedValue(mockParticipation);

      const result = await ParticipationRepository.findByUserAndEvent(1, 1);

      expect(Participation.findOne).toHaveBeenCalledWith({
        where: { userId: 1, eventId: 1 },
        include: [
          { model: User, as: 'user' },
          { model: Event, as: 'event' }
        ]
      });
      expect(result).toEqual(mockParticipation);
    });

    it('should return null if participation not found', async () => {
      Participation.findOne.mockResolvedValue(null);

      const result = await ParticipationRepository.findByUserAndEvent(999, 999);

      expect(result).toBeNull();
    });

    it('should throw ApiError on database error', async () => {
      Participation.findOne.mockRejectedValue(new Error('Database error'));

      await expect(ParticipationRepository.findByUserAndEvent(1, 1))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByIdWithAssociations', () => {
    it('should find participation by ID with associations', async () => {
      const mockParticipation = {
        id: 1,
        userId: 1,
        eventId: 1,
        user: { id: 1, username: 'test' },
        event: { id: 1, title: 'Test Event' }
      };
      Participation.findByPk.mockResolvedValue(mockParticipation);

      const result = await ParticipationRepository.findByIdWithAssociations(1);

      expect(Participation.findByPk).toHaveBeenCalledWith(1, {
        include: [
          { model: User, as: 'user' },
          { model: Event, as: 'event' }
        ]
      });
      expect(result).toEqual(mockParticipation);
    });

    it('should throw ApiError if participation not found', async () => {
      Participation.findByPk.mockResolvedValue(null);

      await expect(ParticipationRepository.findByIdWithAssociations(999))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByUser', () => {
    it('should find participations by user with event associations', async () => {
      const mockParticipations = [
        {
          id: 1,
          userId: 1,
          eventId: 1,
          event: { id: 1, title: 'Event 1' }
        },
        {
          id: 2,
          userId: 1,
          eventId: 2,
          event: { id: 2, title: 'Event 2' }
        }
      ];
      Participation.findAll.mockResolvedValue(mockParticipations);

      const result = await ParticipationRepository.findByUser(1);

      expect(Participation.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: [
          { model: Event, as: 'event' }
        ]
      });
      expect(result).toEqual(mockParticipations);
    });

    it('should return empty array if no participations found', async () => {
      Participation.findAll.mockResolvedValue([]);

      const result = await ParticipationRepository.findByUser(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByEvent', () => {
    it('should find participations by event with user associations', async () => {
      const mockParticipations = [
        {
          id: 1,
          userId: 1,
          eventId: 1,
          user: { id: 1, username: 'user1' }
        },
        {
          id: 2,
          userId: 2,
          eventId: 1,
          user: { id: 2, username: 'user2' }
        }
      ];
      Participation.findAll.mockResolvedValue(mockParticipations);

      const result = await ParticipationRepository.findByEvent(1);

      expect(Participation.findAll).toHaveBeenCalledWith({
        where: { eventId: 1 },
        include: [
          { model: User, as: 'user' }
        ]
      });
      expect(result).toEqual(mockParticipations);
    });
  });

  describe('findByEventForCalculation', () => {
    it('should find participations by event with only deposit attribute', async () => {
      const mockParticipations = [
        { deposit: 100 },
        { deposit: 200 }
      ];
      Participation.findAll.mockResolvedValue(mockParticipations);

      const result = await ParticipationRepository.findByEventForCalculation(1);

      expect(Participation.findAll).toHaveBeenCalledWith({
        where: { eventId: 1 },
        attributes: ['deposit']
      });
      expect(result).toEqual(mockParticipations);
    });
  });

  describe('create', () => {
    it('should create new participation', async () => {
      const participationData = { userId: 1, eventId: 1, deposit: 100 };
      const mockParticipation = { id: 1, ...participationData };
      Participation.create.mockResolvedValue(mockParticipation);

      const result = await ParticipationRepository.create(participationData);

      expect(Participation.create).toHaveBeenCalledWith(participationData);
      expect(result).toEqual(mockParticipation);
    });

    it('should throw ApiError on database error', async () => {
      Participation.create.mockRejectedValue(new Error('Database error'));

      await expect(ParticipationRepository.create({ userId: 1, eventId: 1, deposit: 100 }))
        .rejects.toThrow(ApiError);
    });
  });
}); 