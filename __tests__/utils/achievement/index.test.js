// Unmock the main achievement module for this test
jest.unmock('../../../utils/achievement');

// Mock dependencies  
jest.mock('../../../utils/achievement/CriterionTrackers', () => ({
    CriterionManager: jest.fn(),
    EventCriterionTracker: jest.fn(),
    UserCriterionTracker: jest.fn(),
    AchievementTracker: jest.fn()
}));
jest.mock('../../../utils/achievement/EventCompletionTracker', () => jest.fn());

const achievementUtils = require('../../../utils/achievement');

const { CriterionManager } = require('../../../utils/achievement/CriterionTrackers');
const EventCompletionTracker = require('../../../utils/achievement/EventCompletionTracker');

describe('Achievement Utils Index', () => {
    let mockCriterionManager;
    const mockUserId = 123;
    const mockEventId = 456;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create mock criterion manager
        mockCriterionManager = {
            initializeUser: jest.fn().mockResolvedValue(),
            getUserAchievements: jest.fn().mockResolvedValue([]),
            onEventCompleted: jest.fn().mockResolvedValue(),
            onEventCreated: jest.fn().mockResolvedValue(),
            onEventParticipated: jest.fn().mockResolvedValue(),
            onUserActivityUpdated: jest.fn().mockResolvedValue(),
            onUserBankUpdated: jest.fn().mockResolvedValue()
        };
        
        // Mock the CriterionManager constructor
        CriterionManager.mockImplementation(() => mockCriterionManager);
        
        // Mock console methods to avoid noise in test output
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('Module exports', () => {
        it('should export all required components', () => {
            expect(achievementUtils.criterionManager).toBeDefined();
            expect(achievementUtils.CriterionManager).toBeDefined();
            expect(achievementUtils.EventCompletionTracker).toBeDefined();
            expect(achievementUtils.initializeUser).toBeInstanceOf(Function);
            expect(achievementUtils.getUserAchievements).toBeInstanceOf(Function);
            expect(achievementUtils.onEventCompleted).toBeInstanceOf(Function);
            expect(achievementUtils.onEventCreated).toBeInstanceOf(Function);
            expect(achievementUtils.onEventParticipated).toBeInstanceOf(Function);
            expect(achievementUtils.onUserActivityUpdated).toBeInstanceOf(Function);
            expect(achievementUtils.onUserBankUpdated).toBeInstanceOf(Function);
        });

        it('should export classes from CriterionTrackers', () => {
            expect(achievementUtils.EventCriterionTracker).toBeDefined();
            expect(achievementUtils.UserCriterionTracker).toBeDefined();
            expect(achievementUtils.AchievementTracker).toBeDefined();
        });
    });

    describe('Singleton pattern', () => {

        it('should export the criterionManager instance', () => {
            expect(achievementUtils.criterionManager).toBeDefined();
            expect(typeof achievementUtils.criterionManager).toBe('object');
        });
    });

    describe('Integration with other modules', () => {
        it('should export EventCompletionTracker', () => {
            expect(achievementUtils.EventCompletionTracker).toBe(EventCompletionTracker);
        });

        it('should export CriterionManager class', () => {
            expect(achievementUtils.CriterionManager).toBe(CriterionManager);
        });
    });

    describe('Module structure', () => {
        it('should maintain consistent API', () => {
            const exportedKeys = Object.keys(achievementUtils);
            const expectedKeys = [
                'criterionManager',
                'CriterionManager',
                'EventCriterionTracker',
                'UserCriterionTracker',
                'AchievementTracker',
                'EventCompletionTracker',
                'initializeUser',
                'getUserAchievements',
                'onEventCompleted',
                'onEventCreated',
                'onEventParticipated',
                'onUserActivityUpdated',
                'onUserBankUpdated'
            ];

            expectedKeys.forEach(key => {
                expect(exportedKeys).toContain(key);
            });
        });

        it('should not expose internal implementation details', () => {
            // Check that we don't export things we shouldn't
            const exportedKeys = Object.keys(achievementUtils);
            
            expect(exportedKeys).not.toContain('_internal');
            expect(exportedKeys).not.toContain('private');
            expect(exportedKeys).not.toContain('secret');
        });
    });
}); 