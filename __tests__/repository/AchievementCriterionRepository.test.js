const AchievementCriterionRepository = require('../../repository/AchievementCriterionRepository');
const { AchievementCriterion, Achievement } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  AchievementCriterion: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'AchievementCriterion'
  },
  Achievement: {}
}));

describe('AchievementCriterionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByType', () => {
    it('should find criteria by type with achievement associations', async () => {
      const mockCriteria = [
        {
          id: 1,
          type: 'events_created',
          target: 5,
          achievement: {
            id: 1,
            title: 'Event Creator',
            description: 'Create 5 events'
          }
        },
        {
          id: 2,
          type: 'events_created',
          target: 10,
          achievement: {
            id: 2,
            title: 'Event Master',
            description: 'Create 10 events'
          }
        }
      ];
      AchievementCriterion.findAll.mockResolvedValue(mockCriteria);

      const result = await AchievementCriterionRepository.findByType('events_created');

      expect(AchievementCriterion.findAll).toHaveBeenCalledWith({
        where: { type: 'events_created' },
        include: [{
          model: Achievement,
          as: 'achievement'
        }]
      });
      expect(result).toEqual(mockCriteria);
    });

    it('should return empty array if no criteria found', async () => {
      AchievementCriterion.findAll.mockResolvedValue([]);

      const result = await AchievementCriterionRepository.findByType('non_existent_type');

      expect(result).toEqual([]);
    });

    it('should throw ApiError on database error', async () => {
      AchievementCriterion.findAll.mockRejectedValue(new Error('Database error'));

      await expect(AchievementCriterionRepository.findByType('events_created'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    it('should create new achievement criterion', async () => {
      const criterionData = {
        type: 'events_created',
        target: 5,
        achievementId: 1
      };
      const mockCriterion = { id: 1, ...criterionData };
      AchievementCriterion.create.mockResolvedValue(mockCriterion);

      const result = await AchievementCriterionRepository.create(criterionData);

      expect(AchievementCriterion.create).toHaveBeenCalledWith(criterionData);
      expect(result).toEqual(mockCriterion);
    });

    it('should throw ApiError on database error', async () => {
      AchievementCriterion.create.mockRejectedValue(new Error('Database error'));

      await expect(AchievementCriterionRepository.create({
        type: 'events_created',
        target: 5
      })).rejects.toThrow(ApiError);
    });
  });

  describe('findByPk', () => {
    it('should find criterion by primary key', async () => {
      const mockCriterion = {
        id: 1,
        type: 'events_created',
        target: 5,
        achievementId: 1
      };
      AchievementCriterion.findByPk.mockResolvedValue(mockCriterion);

      const result = await AchievementCriterionRepository.findByPk(1);

      expect(AchievementCriterion.findByPk).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(mockCriterion);
    });

    it('should throw ApiError if criterion not found', async () => {
      AchievementCriterion.findByPk.mockResolvedValue(null);

      await expect(AchievementCriterionRepository.findByPk(999))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findAll', () => {
    it('should find all criteria', async () => {
      const mockCriteria = [
        { id: 1, type: 'events_created', target: 5 },
        { id: 2, type: 'balance_earned', target: 1000 }
      ];
      AchievementCriterion.findAll.mockResolvedValue(mockCriteria);

      const result = await AchievementCriterionRepository.findAll();

      expect(AchievementCriterion.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockCriteria);
    });
  });

  describe('update', () => {
    it('should update criterion', async () => {
      AchievementCriterion.update.mockResolvedValue([1]);

      const result = await AchievementCriterionRepository.update(1, { target: 10 });

      expect(AchievementCriterion.update).toHaveBeenCalledWith(
        { target: 10 },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should throw ApiError if criterion not found', async () => {
      AchievementCriterion.update.mockResolvedValue([0]);

      await expect(AchievementCriterionRepository.update(999, { target: 10 }))
        .rejects.toThrow(ApiError);
    });
  });

  describe('destroy', () => {
    it('should delete criterion', async () => {
      AchievementCriterion.destroy.mockResolvedValue(1);

      const result = await AchievementCriterionRepository.destroy(1);

      expect(AchievementCriterion.destroy).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(result).toBe(1);
    });

    it('should throw ApiError if criterion not found', async () => {
      AchievementCriterion.destroy.mockResolvedValue(0);

      await expect(AchievementCriterionRepository.destroy(999))
        .rejects.toThrow(ApiError);
    });
  });
}); 