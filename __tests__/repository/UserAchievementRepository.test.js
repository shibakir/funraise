const UserAchievementRepository = require('../../repository/UserAchievementRepository');
const { UserAchievement, Achievement, UserCriterionProgress, AchievementCriterion } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  UserAchievement: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'UserAchievement'
  },
  Achievement: {},
  UserCriterionProgress: {},
  AchievementCriterion: {}
}));

describe('UserAchievementRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserAndAchievement', () => {
    it('should find user achievement by user and achievement IDs', async () => {
      const mockUserAchievement = {
        id: 1,
        userId: 1,
        achievementId: 1,
        status: 'in_progress'
      };
      UserAchievement.findOne.mockResolvedValue(mockUserAchievement);

      const result = await UserAchievementRepository.findByUserAndAchievement(1, 1);

      expect(UserAchievement.findOne).toHaveBeenCalledWith({
        where: {
          userId: 1,
          achievementId: 1
        }
      });
      expect(result).toEqual(mockUserAchievement);
    });

    it('should return null if user achievement not found', async () => {
      UserAchievement.findOne.mockResolvedValue(null);

      const result = await UserAchievementRepository.findByUserAndAchievement(999, 999);

      expect(result).toBeNull();
    });

    it('should throw ApiError on database error', async () => {
      UserAchievement.findOne.mockRejectedValue(new Error('Database error'));

      await expect(UserAchievementRepository.findByUserAndAchievement(1, 1))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByUserWithDetails', () => {
    it('should find user achievements with achievement and progress details', async () => {
      const mockUserAchievements = [
        {
          id: 1,
          userId: 1,
          achievementId: 1,
          status: 'completed',
          achievement: {
            id: 1,
            title: 'First Achievement',
            description: 'Test description'
          },
          progresses: [
            {
              id: 1,
              currentValue: 5,
              completed: true,
              criterion: {
                id: 1,
                type: 'events_created',
                target: 5
              }
            }
          ]
        }
      ];
      UserAchievement.findAll.mockResolvedValue(mockUserAchievements);

      const result = await UserAchievementRepository.findByUserWithDetails(1);

      expect(UserAchievement.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: [
          {
            model: Achievement,
            as: 'achievement'
          },
          {
            model: UserCriterionProgress,
            as: 'progresses',
            include: [{
              model: AchievementCriterion,
              as: 'criterion'
            }]
          }
        ]
      });
      expect(result).toEqual(mockUserAchievements);
    });

    it('should return empty array if no user achievements found', async () => {
      UserAchievement.findAll.mockResolvedValue([]);

      const result = await UserAchievementRepository.findByUserWithDetails(999);

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update status and unlockedAt with provided date', async () => {
      const unlockedAt = new Date();
      UserAchievement.update.mockResolvedValue([1]);

      const result = await UserAchievementRepository.updateStatus(1, 'completed', unlockedAt);

      expect(UserAchievement.update).toHaveBeenCalledWith(
        {
          status: 'completed',
          unlockedAt: unlockedAt
        },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should update status with null unlockedAt when not provided', async () => {
      UserAchievement.update.mockResolvedValue([1]);

      const result = await UserAchievementRepository.updateStatus(1, 'in_progress');

      expect(UserAchievement.update).toHaveBeenCalledWith(
        {
          status: 'in_progress',
          unlockedAt: null
        },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should throw ApiError if user achievement not found', async () => {
      UserAchievement.update.mockResolvedValue([0]);

      await expect(UserAchievementRepository.updateStatus(999, 'completed'))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError on database error', async () => {
      UserAchievement.update.mockRejectedValue(new Error('Database error'));

      await expect(UserAchievementRepository.updateStatus(1, 'completed'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    it('should create new user achievement', async () => {
      const userAchievementData = {
        userId: 1,
        achievementId: 1,
        status: 'in_progress'
      };
      const mockUserAchievement = { id: 1, ...userAchievementData };
      UserAchievement.create.mockResolvedValue(mockUserAchievement);

      const result = await UserAchievementRepository.create(userAchievementData);

      expect(UserAchievement.create).toHaveBeenCalledWith(userAchievementData);
      expect(result).toEqual(mockUserAchievement);
    });

    it('should throw ApiError on database error', async () => {
      UserAchievement.create.mockRejectedValue(new Error('Database error'));

      await expect(UserAchievementRepository.create({
        userId: 1,
        achievementId: 1
      })).rejects.toThrow(ApiError);
    });
  });

  describe('findByPk', () => {
    it('should find user achievement by primary key', async () => {
      const mockUserAchievement = {
        id: 1,
        userId: 1,
        achievementId: 1,
        status: 'in_progress'
      };
      UserAchievement.findByPk.mockResolvedValue(mockUserAchievement);

      const result = await UserAchievementRepository.findByPk(1);

      expect(UserAchievement.findByPk).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(mockUserAchievement);
    });

    it('should throw ApiError if user achievement not found', async () => {
      UserAchievement.findByPk.mockResolvedValue(null);

      await expect(UserAchievementRepository.findByPk(999))
        .rejects.toThrow(ApiError);
    });
  });
}); 