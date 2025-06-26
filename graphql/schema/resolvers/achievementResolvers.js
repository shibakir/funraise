const { 
    userAchievementService, 
    achievementService, 
    userCriterionProgressService, 
    achievementCriterionService 
} = require('../../../service');

/**
 * GraphQL resolvers for Achievement-related operations
 * Handles queries and field resolvers for user achievements and progress tracking
 */
const achievementResolvers = {
    Query: {
        /**
         * Retrieves all achievements for a specific user with detailed progress information
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Query arguments
         * @param {number} args.userId - ID of the user to fetch achievements for
         * @returns {Promise<UserAchievement[]>} Array of user achievements with progress details
         */
        userAchievements: async (_, { userId }) => {
            try {
                return await userAchievementService.findByUserWithDetails(userId);
            } catch (error) {
                console.error('Error fetching user achievements:', error);
                return [];
            }
        }
    },

    /**
     * Field resolvers for UserAchievement type
     * These resolvers handle nested field resolution for UserAchievement objects
     */
    UserAchievement: {
        /**
         * Resolves the achievement object associated with a user achievement
         * @param {UserAchievement} userAchievement - Parent UserAchievement object
         * @returns {Promise<Achievement|null>} Achievement object or null if not found
         */
        achievement: async (userAchievement) => {
            // Return cached achievement if already loaded
            if (userAchievement.achievement) return userAchievement.achievement;
            
            try {
                return await achievementService.findById(userAchievement.achievementId);
            } catch (error) {
                console.error('Error fetching achievement:', error);
                return null;
            }
        },

        /**
         * Resolves progress information for all criteria within this user achievement
         * Maps progress data and adds completion status for each criterion
         * @param {UserAchievement} userAchievement - Parent UserAchievement object
         * @returns {Promise<UserCriterionProgress[]>} Array of criterion progress with completion status
         */
        progress: async (userAchievement) => {
            // Return cached progress data if already loaded
            if (userAchievement.progresses) {
                return userAchievement.progresses.map(progress => ({
                    ...progress.toJSON(),
                    isCompleted: progress.completed
                }));
            }
            
            try {
                const progresses = await userCriterionProgressService.findByUserAchievementWithCriteria(userAchievement.id);
                return progresses.map(progress => ({
                    ...progress.toJSON(),
                    isCompleted: progress.completed
                }));
            } catch (error) {
                console.error('Error fetching progress:', error);
                return [];
            }
        }
    },

    /**
     * Field resolvers for UserCriterionProgress type
     * Handles resolution of criterion details for progress tracking
     */
    UserCriterionProgress: {
        /**
         * Resolves the achievement criterion associated with a progress record
         * @param {UserCriterionProgress} progress - Parent UserCriterionProgress object
         * @returns {Promise<AchievementCriterion|null>} Criterion object or null if not found
         */
        criterion: async (progress) => {
            // Return cached criterion if already loaded
            if (progress.criterion) return progress.criterion;
            
            try {
                return await achievementCriterionService.findById(progress.criterionId);
            } catch (error) {
                console.error('Error fetching criterion:', error);
                return null;
            }
        }
    },

    /**
     * Field resolvers for AchievementCriterion type
     * Provides computed fields and data transformation for achievement criteria
     */
    AchievementCriterion: {
        /**
         * Maps the internal 'type' field to the GraphQL 'criteriaType' field
         * @param {AchievementCriterion} criterion - Parent AchievementCriterion object
         * @returns {string} The type of the achievement criterion
         */
        criteriaType: (criterion) => criterion.type,

        /**
         * Maps the internal 'value' field to the GraphQL 'criteriaValue' field
         * @param {AchievementCriterion} criterion - Parent AchievementCriterion object
         * @returns {number} The target value for the achievement criterion
         */
        criteriaValue: (criterion) => criterion.value,

        /**
         * Generates a human-readable description of the achievement criterion
         * @param {AchievementCriterion} criterion - Parent AchievementCriterion object
         * @returns {string} Formatted description combining type and value
         */
        description: (criterion) => `${criterion.type} criterion with value ${criterion.value}`
    }
};

module.exports = achievementResolvers; 