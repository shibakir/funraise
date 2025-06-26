const AchievementRepository = require('../../repository/AchievementRepository');
const { Achievement, AchievementCriterion } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  Achievement: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'Achievement'
  },
  AchievementCriterion: {}
}));

describe('AchievementRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllWithCriteria', () => {
    it('should find all achievements with criteria', async () => {
      const mockAchievements = [
        {
          id: 1,
          title: 'First Achievement',
          description: 'Test description',
          criteria: [
            { id: 1, type: 'events_created', target: 5 },
            { id: 2, type: 'events_completed', target: 3 }
          ]
        },
        {
          id: 2,
          title: 'Second Achievement',
          description: 'Another test',
          criteria: [
            { id: 3, type: 'balance_earned', target: 1000 }
          ]
        }
      ];
      Achievement.findAll.mockResolvedValue(mockAchievements);

      const result = await AchievementRepository.findAllWithCriteria();

      expect(Achievement.findAll).toHaveBeenCalledWith({
        include: [{
          model: AchievementCriterion,
          as: 'criteria'
        }]
      });
      expect(result).toEqual(mockAchievements);
    });

    it('should return empty array if no achievements found', async () => {
      Achievement.findAll.mockResolvedValue([]);

      const result = await AchievementRepository.findAllWithCriteria();

      expect(result).toEqual([]);
    });

    it('should throw ApiError on database error', async () => {
      Achievement.findAll.mockRejectedValue(new Error('Database error'));

      await expect(AchievementRepository.findAllWithCriteria())
        .rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    it('should create new achievement', async () => {
      const achievementData = {
        title: 'New Achievement',
        description: 'Test description',
        icon: 'trophy'
      };
      const mockAchievement = { id: 1, ...achievementData };
      Achievement.create.mockResolvedValue(mockAchievement);

      const result = await AchievementRepository.create(achievementData);

      expect(Achievement.create).toHaveBeenCalledWith(achievementData);
      expect(result).toEqual(mockAchievement);
    });

    it('should throw ApiError on database error', async () => {
      Achievement.create.mockRejectedValue(new Error('Database error'));

      await expect(AchievementRepository.create({
        title: 'Test',
        description: 'Test desc'
      })).rejects.toThrow(ApiError);
    });
  });

  describe('findByPk', () => {
    it('should find achievement by primary key', async () => {
      const mockAchievement = {
        id: 1,
        title: 'Test Achievement',
        description: 'Test description'
      };
      Achievement.findByPk.mockResolvedValue(mockAchievement);

      const result = await AchievementRepository.findByPk(1);

      expect(Achievement.findByPk).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(mockAchievement);
    });

    it('should throw ApiError if achievement not found', async () => {
      Achievement.findByPk.mockResolvedValue(null);

      await expect(AchievementRepository.findByPk(999))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findAll', () => {
    it('should find all achievements', async () => {
      const mockAchievements = [
        { id: 1, title: 'Achievement 1' },
        { id: 2, title: 'Achievement 2' }
      ];
      Achievement.findAll.mockResolvedValue(mockAchievements);

      const result = await AchievementRepository.findAll();

      expect(Achievement.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockAchievements);
    });
  });

  describe('update', () => {
    it('should update achievement', async () => {
      Achievement.update.mockResolvedValue([1]);

      const result = await AchievementRepository.update(1, { title: 'Updated Title' });

      expect(Achievement.update).toHaveBeenCalledWith(
        { title: 'Updated Title' },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should throw ApiError if achievement not found', async () => {
      Achievement.update.mockResolvedValue([0]);

      await expect(AchievementRepository.update(999, { title: 'Updated' }))
        .rejects.toThrow(ApiError);
    });
  });

  describe('destroy', () => {
    it('should delete achievement', async () => {
      Achievement.destroy.mockResolvedValue(1);

      const result = await AchievementRepository.destroy(1);

      expect(Achievement.destroy).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(result).toBe(1);
    });

    it('should throw ApiError if achievement not found', async () => {
      Achievement.destroy.mockResolvedValue(0);

      await expect(AchievementRepository.destroy(999))
        .rejects.toThrow(ApiError);
    });
  });
}); 