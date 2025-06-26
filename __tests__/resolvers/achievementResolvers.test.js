const achievementResolvers = require('../../graphql/schema/resolvers/achievementResolvers');
const { 
  userAchievementService, 
  achievementService, 
  userCriterionProgressService, 
  achievementCriterionService 
} = require('../../service');

describe('achievementResolvers', () => {
  describe('Query.userAchievements', () => {
    it('should return the achievements of the user', async () => {
      const mockUserAchievements = [
        {
          id: 1,
          userId: 1,
          achievementId: 1,
          isCompleted: true,
          unlockedAt: new Date()
        },
        {
          id: 2,
          userId: 1,
          achievementId: 2,
          isCompleted: false,
          unlockedAt: null
        }
      ];

      userAchievementService.findByUserWithDetails.mockResolvedValue(mockUserAchievements);

      const result = await achievementResolvers.Query.userAchievements(null, { userId: 1 });

      expect(userAchievementService.findByUserWithDetails).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserAchievements);
    });

    it('should return an empty array if there is an error fetching the user achievements', async () => {
      userAchievementService.findByUserWithDetails.mockRejectedValue(new Error('Database error'));

      const result = await achievementResolvers.Query.userAchievements(null, { userId: 1 });

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching user achievements:', expect.any(Error));
    });

    it('should return an empty array if the user achievements are not found', async () => {
      userAchievementService.findByUserWithDetails.mockResolvedValue([]);

      const result = await achievementResolvers.Query.userAchievements(null, { userId: 999 });

      expect(result).toEqual([]);
    });
  });

  describe('UserAchievement field resolvers', () => {
    describe('UserAchievement.achievement', () => {
      it('should return the achievement if it is already loaded', async () => {
        const mockUserAchievement = {
          id: 1,
          achievementId: 1,
          achievement: {
            id: 1,
            name: 'First Steps',
            description: 'Complete your first event'
          }
        };

        const result = await achievementResolvers.UserAchievement.achievement(mockUserAchievement);

        expect(result).toEqual(mockUserAchievement.achievement);
        expect(achievementService.findById).not.toHaveBeenCalled();
      });

      it('should load the achievement if it is not loaded', async () => {
        const mockUserAchievement = {
          id: 1,
          achievementId: 1
        };

        const mockAchievement = {
          id: 1,
          name: 'First Steps',
          description: 'Complete your first event'
        };

        achievementService.findById.mockResolvedValue(mockAchievement);

        const result = await achievementResolvers.UserAchievement.achievement(mockUserAchievement);

        expect(achievementService.findById).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockAchievement);
      });

      it('should return null if there is an error fetching the achievement', async () => {
        const mockUserAchievement = {
          id: 1,
          achievementId: 1
        };

        achievementService.findById.mockRejectedValue(new Error('Database error'));

        const result = await achievementResolvers.UserAchievement.achievement(mockUserAchievement);

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Error fetching achievement:', expect.any(Error));
      });
    });

    describe('UserAchievement.progress', () => {
      it('should return the progress if it is already loaded', async () => {
        const mockUserAchievement = {
          id: 1,
          progresses: [
            {
              id: 1,
              completed: true,
              toJSON: () => ({ id: 1, currentValue: 5, targetValue: 5 })
            },
            {
              id: 2,
              completed: false,
              toJSON: () => ({ id: 2, currentValue: 3, targetValue: 10 })
            }
          ]
        };

        const result = await achievementResolvers.UserAchievement.progress(mockUserAchievement);

        expect(result).toEqual([
          { id: 1, currentValue: 5, targetValue: 5, isCompleted: true },
          { id: 2, currentValue: 3, targetValue: 10, isCompleted: false }
        ]);
        expect(userCriterionProgressService.findByUserAchievementWithCriteria).not.toHaveBeenCalled();
      });

      it('should load the progress if it is not loaded', async () => {
        const mockUserAchievement = { id: 1 };

        const mockProgresses = [
          {
            id: 1,
            completed: true,
            toJSON: () => ({ id: 1, currentValue: 5, targetValue: 5 })
          },
          {
            id: 2,
            completed: false,
            toJSON: () => ({ id: 2, currentValue: 2, targetValue: 10 })
          }
        ];

        userCriterionProgressService.findByUserAchievementWithCriteria.mockResolvedValue(mockProgresses);

        const result = await achievementResolvers.UserAchievement.progress(mockUserAchievement);

        expect(userCriterionProgressService.findByUserAchievementWithCriteria).toHaveBeenCalledWith(1);
        expect(result).toEqual([
          { id: 1, currentValue: 5, targetValue: 5, isCompleted: true },
          { id: 2, currentValue: 2, targetValue: 10, isCompleted: false }
        ]);
      });

      it('should return an empty array if there is an error fetching the progress', async () => {
        const mockUserAchievement = { id: 1 };

        userCriterionProgressService.findByUserAchievementWithCriteria.mockRejectedValue(new Error('Database error'));

        const result = await achievementResolvers.UserAchievement.progress(mockUserAchievement);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching progress:', expect.any(Error));
      });
    });
  });

  describe('UserCriterionProgress field resolvers', () => {
    describe('UserCriterionProgress.criterion', () => {
      it('should return the criterion if it is already loaded', async () => {
        const mockProgress = {
          id: 1,
          criterionId: 1,
          criterion: {
            id: 1,
            type: 'EVENT_COMPLETION',
            value: '5',
            description: 'Complete 5 events'
          }
        };

        const result = await achievementResolvers.UserCriterionProgress.criterion(mockProgress);

        expect(result).toEqual(mockProgress.criterion);
        expect(achievementCriterionService.findById).not.toHaveBeenCalled();
      });

      it('should load the criterion if it is not loaded', async () => {
        const mockProgress = {
          id: 1,
          criterionId: 1
        };

        const mockCriterion = {
          id: 1,
          type: 'EVENT_COMPLETION',
          value: '5',
          description: 'Complete 5 events'
        };

        achievementCriterionService.findById.mockResolvedValue(mockCriterion);

        const result = await achievementResolvers.UserCriterionProgress.criterion(mockProgress);

        expect(achievementCriterionService.findById).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockCriterion);
      });

      it('should return null if there is an error fetching the criterion', async () => {
        const mockProgress = {
          id: 1,
          criterionId: 1
        };

        achievementCriterionService.findById.mockRejectedValue(new Error('Database error'));

        const result = await achievementResolvers.UserCriterionProgress.criterion(mockProgress);

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Error fetching criterion:', expect.any(Error));
      });
    });
  });

  describe('AchievementCriterion field resolvers', () => {
    describe('AchievementCriterion.criteriaType', () => {
      it('should return the type of the criterion', () => {
        const mockCriterion = {
          id: 1,
          type: 'EVENT_COMPLETION',
          value: '5'
        };

        const result = achievementResolvers.AchievementCriterion.criteriaType(mockCriterion);

        expect(result).toBe('EVENT_COMPLETION');
      });
    });

    describe('AchievementCriterion.criteriaValue', () => {
      it('should return the value of the criterion', () => {
        const mockCriterion = {
          id: 1,
          type: 'EVENT_COMPLETION',
          value: '5'
        };

        const result = achievementResolvers.AchievementCriterion.criteriaValue(mockCriterion);

        expect(result).toBe('5');
      });
    });

    describe('AchievementCriterion.description', () => {
      it('should return the description of the criterion', () => {
        const mockCriterion = {
          id: 1,
          type: 'EVENT_COMPLETION',
          value: '5'
        };

        const result = achievementResolvers.AchievementCriterion.description(mockCriterion);

        expect(result).toBe('EVENT_COMPLETION criterion with value 5');
      });
    });
  });
}); 