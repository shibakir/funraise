const UserCriterionProgressRepository = require('../../repository/UserCriterionProgressRepository');
const { UserCriterionProgress, AchievementCriterion } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  UserCriterionProgress: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'UserCriterionProgress'
  },
  AchievementCriterion: {}
}));

describe('UserCriterionProgressRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserAchievementAndCriterion', () => {
    it('should find progress by user achievement and criterion IDs', async () => {
      const mockProgress = {
        id: 1,
        userAchievementId: 1,
        criterionId: 1,
        currentValue: 3,
        completed: false
      };
      UserCriterionProgress.findOne.mockResolvedValue(mockProgress);

      const result = await UserCriterionProgressRepository.findByUserAchievementAndCriterion(1, 1);

      expect(UserCriterionProgress.findOne).toHaveBeenCalledWith({
        where: {
          userAchievementId: 1,
          criterionId: 1
        }
      });
      expect(result).toEqual(mockProgress);
    });

    it('should return null if progress not found', async () => {
      UserCriterionProgress.findOne.mockResolvedValue(null);

      const result = await UserCriterionProgressRepository.findByUserAchievementAndCriterion(999, 999);

      expect(result).toBeNull();
    });

    it('should throw ApiError on database error', async () => {
      UserCriterionProgress.findOne.mockRejectedValue(new Error('Database error'));

      await expect(UserCriterionProgressRepository.findByUserAchievementAndCriterion(1, 1))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByUserAchievement', () => {
    it('should find all progress entries by user achievement ID', async () => {
      const mockProgresses = [
        {
          id: 1,
          userAchievementId: 1,
          criterionId: 1,
          currentValue: 3,
          completed: false
        },
        {
          id: 2,
          userAchievementId: 1,
          criterionId: 2,
          currentValue: 5,
          completed: true
        }
      ];
      UserCriterionProgress.findAll.mockResolvedValue(mockProgresses);

      const result = await UserCriterionProgressRepository.findByUserAchievement(1);

      expect(UserCriterionProgress.findAll).toHaveBeenCalledWith({
        where: { userAchievementId: 1 }
      });
      expect(result).toEqual(mockProgresses);
    });

    it('should return empty array if no progresses found', async () => {
      UserCriterionProgress.findAll.mockResolvedValue([]);

      const result = await UserCriterionProgressRepository.findByUserAchievement(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByUserAchievementWithCriteria', () => {
    it('should find progress entries with criterion details', async () => {
      const mockProgresses = [
        {
          id: 1,
          userAchievementId: 1,
          criterionId: 1,
          currentValue: 3,
          completed: false,
          criterion: {
            id: 1,
            type: 'events_created',
            target: 5
          }
        }
      ];
      UserCriterionProgress.findAll.mockResolvedValue(mockProgresses);

      const result = await UserCriterionProgressRepository.findByUserAchievementWithCriteria(1);

      expect(UserCriterionProgress.findAll).toHaveBeenCalledWith({
        where: { userAchievementId: 1 },
        include: [{
          model: AchievementCriterion,
          as: 'criterion'
        }]
      });
      expect(result).toEqual(mockProgresses);
    });
  });

  describe('createProgress', () => {
    it('should create progress with default values', async () => {
      const mockProgress = {
        id: 1,
        userAchievementId: 1,
        criterionId: 1,
        currentValue: 0,
        completed: false
      };
      UserCriterionProgress.create.mockResolvedValue(mockProgress);

      const result = await UserCriterionProgressRepository.createProgress(1, 1);

      expect(UserCriterionProgress.create).toHaveBeenCalledWith({
        userAchievementId: 1,
        criterionId: 1,
        currentValue: 0,
        completed: false
      });
      expect(result).toEqual(mockProgress);
    });

    it('should create progress with custom values', async () => {
      const mockProgress = {
        id: 1,
        userAchievementId: 1,
        criterionId: 1,
        currentValue: 5,
        completed: true
      };
      UserCriterionProgress.create.mockResolvedValue(mockProgress);

      const result = await UserCriterionProgressRepository.createProgress(1, 1, 5, true);

      expect(UserCriterionProgress.create).toHaveBeenCalledWith({
        userAchievementId: 1,
        criterionId: 1,
        currentValue: 5,
        completed: true
      });
      expect(result).toEqual(mockProgress);
    });

    it('should throw ApiError on database error', async () => {
      UserCriterionProgress.create.mockRejectedValue(new Error('Database error'));

      await expect(UserCriterionProgressRepository.createProgress(1, 1))
        .rejects.toThrow(ApiError);
    });
  });

  describe('updateProgress', () => {
    it('should update progress with completedAt date', async () => {
      const completedAt = new Date();
      UserCriterionProgress.update.mockResolvedValue([1]);

      const result = await UserCriterionProgressRepository.updateProgress(1, 5, true, completedAt);

      expect(UserCriterionProgress.update).toHaveBeenCalledWith(
        {
          currentValue: 5,
          completed: true,
          completedAt: completedAt
        },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should update progress without completedAt date', async () => {
      UserCriterionProgress.update.mockResolvedValue([1]);

      const result = await UserCriterionProgressRepository.updateProgress(1, 3, false);

      expect(UserCriterionProgress.update).toHaveBeenCalledWith(
        {
          currentValue: 3,
          completed: false,
          completedAt: null
        },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should throw ApiError if progress not found', async () => {
      UserCriterionProgress.update.mockResolvedValue([0]);

      await expect(UserCriterionProgressRepository.updateProgress(999, 5, true))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError on database error', async () => {
      UserCriterionProgress.update.mockRejectedValue(new Error('Database error'));

      await expect(UserCriterionProgressRepository.updateProgress(1, 5, true))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByPk', () => {
    it('should find progress by primary key', async () => {
      const mockProgress = {
        id: 1,
        userAchievementId: 1,
        criterionId: 1,
        currentValue: 3,
        completed: false
      };
      UserCriterionProgress.findByPk.mockResolvedValue(mockProgress);

      const result = await UserCriterionProgressRepository.findByPk(1);

      expect(UserCriterionProgress.findByPk).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(mockProgress);
    });

    it('should throw ApiError if progress not found', async () => {
      UserCriterionProgress.findByPk.mockResolvedValue(null);

      await expect(UserCriterionProgressRepository.findByPk(999))
        .rejects.toThrow(ApiError);
    });
  });
}); 