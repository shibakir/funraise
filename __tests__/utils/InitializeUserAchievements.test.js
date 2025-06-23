const initializeUserAchievements = require('../../utils/user/InitializeUserAchievements');

// Mock dependencies
jest.mock('../../service/UserService');
jest.mock('../../utils/achievement');

const userService = require('../../service/UserService');
const { initializeUser } = require('../../utils/achievement');

describe('InitializeUserAchievements', () => {
    const mockUserId = 123;
    const mockUser = {
        id: mockUserId,
        username: 'testuser',
        email: 'test@example.com'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock console methods to avoid noise in test output
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        // Restore console methods
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('successful initialization', () => {
        it('should initialize user achievements successfully', async () => {
            // Setup mocks
            userService.findById.mockResolvedValue(mockUser);
            initializeUser.mockResolvedValue(true);

            const data = { userId: mockUserId };

            // Execute
            await initializeUserAchievements(data);

            // Verify
            expect(userService.findById).toHaveBeenCalledWith(mockUserId, false);
            expect(initializeUser).toHaveBeenCalledWith(mockUserId);
            expect(console.log).toHaveBeenCalledWith('Initialize user achievements...');
            expect(console.log).toHaveBeenCalledWith(`Successfully initialized achievements for user ${mockUserId}`);
        });

        it('should call userService.findById with correct parameters', async () => {
            userService.findById.mockResolvedValue(mockUser);
            initializeUser.mockResolvedValue(true);

            const data = { userId: mockUserId };

            await initializeUserAchievements(data);

            expect(userService.findById).toHaveBeenCalledTimes(1);
            expect(userService.findById).toHaveBeenCalledWith(mockUserId, false);
        });

        it('should call initializeUser with userId', async () => {
            userService.findById.mockResolvedValue(mockUser);
            initializeUser.mockResolvedValue(true);

            const data = { userId: mockUserId };

            await initializeUserAchievements(data);

            expect(initializeUser).toHaveBeenCalledTimes(1);
            expect(initializeUser).toHaveBeenCalledWith(mockUserId);
        });

        it('should log initialization start message', async () => {
            userService.findById.mockResolvedValue(mockUser);
            initializeUser.mockResolvedValue(true);

            const data = { userId: mockUserId };

            await initializeUserAchievements(data);

            expect(console.log).toHaveBeenCalledWith('Initialize user achievements...');
        });

        it('should log success message with userId', async () => {
            userService.findById.mockResolvedValue(mockUser);
            initializeUser.mockResolvedValue(true);

            const data = { userId: mockUserId };

            await initializeUserAchievements(data);

            expect(console.log).toHaveBeenCalledWith(`Successfully initialized achievements for user ${mockUserId}`);
        });
    });

    describe('error handling', () => {
        it('should throw error when user is not found', async () => {
            userService.findById.mockResolvedValue(null);

            const data = { userId: mockUserId };

            await expect(initializeUserAchievements(data))
                .rejects
                .toThrow('User not found');

            expect(userService.findById).toHaveBeenCalledWith(mockUserId, false);
            expect(initializeUser).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith('Error initializing user achievements:', expect.any(Error));
        });

        it('should throw error when userService.findById fails', async () => {
            const dbError = new Error('Database connection failed');
            userService.findById.mockRejectedValue(dbError);

            const data = { userId: mockUserId };

            await expect(initializeUserAchievements(data))
                .rejects
                .toThrow('Database connection failed');

            expect(userService.findById).toHaveBeenCalledWith(mockUserId, false);
            expect(initializeUser).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith('Error initializing user achievements:', dbError);
        });

        it('should throw error when initializeUser fails', async () => {
            const achievementError = new Error('Achievement initialization failed');
            userService.findById.mockResolvedValue(mockUser);
            initializeUser.mockRejectedValue(achievementError);

            const data = { userId: mockUserId };

            await expect(initializeUserAchievements(data))
                .rejects
                .toThrow('Achievement initialization failed');

            expect(userService.findById).toHaveBeenCalledWith(mockUserId, false);
            expect(initializeUser).toHaveBeenCalledWith(mockUserId);
            expect(console.error).toHaveBeenCalledWith('Error initializing user achievements:', achievementError);
        });

        it('should log error message when initialization fails', async () => {
            const testError = new Error('Test error');
            userService.findById.mockRejectedValue(testError);

            const data = { userId: mockUserId };

            try {
                await initializeUserAchievements(data);
            } catch (error) {
                // Expected to throw
            }

            expect(console.error).toHaveBeenCalledWith('Error initializing user achievements:', testError);
        });
    });

    describe('input validation', () => {
        it('should handle data with userId property', async () => {
            userService.findById.mockResolvedValue(mockUser);
            initializeUser.mockResolvedValue(true);

            const data = { userId: 456 };

            await initializeUserAchievements(data);

            expect(userService.findById).toHaveBeenCalledWith(456, false);
            expect(initializeUser).toHaveBeenCalledWith(456);
        });

        it('should handle different user types', async () => {
            const differentUser = {
                id: 789,
                username: 'anotheruser',
                email: 'another@example.com',
                isActive: true
            };

            userService.findById.mockResolvedValue(differentUser);
            initializeUser.mockResolvedValue(true);

            const data = { userId: 789 };

            await initializeUserAchievements(data);

            expect(userService.findById).toHaveBeenCalledWith(789, false);
            expect(initializeUser).toHaveBeenCalledWith(789);
            expect(console.log).toHaveBeenCalledWith('Successfully initialized achievements for user 789');
        });
    });

    describe('edge cases', () => {
        it('should handle user with undefined properties', async () => {
            const minimalUser = { id: mockUserId };
            userService.findById.mockResolvedValue(minimalUser);
            initializeUser.mockResolvedValue(true);

            const data = { userId: mockUserId };

            await initializeUserAchievements(data);

            expect(userService.findById).toHaveBeenCalledWith(mockUserId, false);
            expect(initializeUser).toHaveBeenCalledWith(mockUserId);
        });

        it('should maintain consistency in error handling', async () => {
            const errors = [
                new Error('Network error'),
                new Error('Permission denied'),
                new Error('Invalid data')
            ];

            for (const error of errors) {
                jest.clearAllMocks();
                userService.findById.mockRejectedValue(error);

                const data = { userId: mockUserId };

                await expect(initializeUserAchievements(data))
                    .rejects
                    .toThrow(error.message);

                expect(console.error).toHaveBeenCalledWith('Error initializing user achievements:', error);
            }
        });
    });
}); 