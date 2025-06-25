const TokenService = require('../../service/TokenService');
const { Token } = require('../../model');
const { TokenRepository } = require('../../repository');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../model');
jest.mock('../../repository', () => ({
    TokenRepository: {
        findByRefreshToken: jest.fn(),
        deleteByUserId: jest.fn(),
        create: jest.fn(),
        deleteByRefreshToken: jest.fn()
    }
}));

describe('TokenService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveToken', () => {
        it('should successfully save a refresh token', async () => {
            const mockToken = {
                id: 1,
                userId: 1,
                refreshToken: 'test-refresh-token'
            };

            TokenRepository.deleteByUserId.mockResolvedValue(0); // old token not found
            TokenRepository.create.mockResolvedValue(mockToken);

            const result = await TokenService.saveToken(1, 'test-refresh-token');

            expect(TokenRepository.deleteByUserId).toHaveBeenCalledWith(1);
            expect(TokenRepository.create).toHaveBeenCalledWith({
                userId: 1,
                refreshToken: 'test-refresh-token'
            });
            expect(result).toEqual(mockToken);
        });

        it('should delete the old token before saving the new one', async () => {
            const mockToken = {
                id: 2,
                userId: 1,
                refreshToken: 'new-refresh-token'
            };

            TokenRepository.deleteByUserId.mockResolvedValue(1); // old token found and deleted
            TokenRepository.create.mockResolvedValue(mockToken);

            const result = await TokenService.saveToken(1, 'new-refresh-token');

            expect(TokenRepository.deleteByUserId).toHaveBeenCalledWith(1);
            expect(TokenRepository.create).toHaveBeenCalledWith({
                userId: 1,
                refreshToken: 'new-refresh-token'
            });
            expect(result).toEqual(mockToken);
        });

        it('should handle database errors when saving', async () => {
            const dbError = new Error('Database connection error');
            TokenRepository.deleteByUserId.mockResolvedValue(0);
            TokenRepository.create.mockRejectedValue(dbError);

            await expect(TokenService.saveToken(1, 'test-token'))
                .rejects
                .toThrow('Failed to save refresh token');
        });

        it('should handle errors when deleting the old token', async () => {
            const dbError = new Error('Database connection error');
            TokenRepository.deleteByUserId.mockRejectedValue(dbError);

            await expect(TokenService.saveToken(1, 'test-token'))
                .rejects
                .toThrow('Failed to save refresh token');
        });
    });

    describe('findToken', () => {
        it('should find a token by refresh token', async () => {
            const mockToken = {
                id: 1,
                userId: 1,
                refreshToken: 'test-refresh-token'
            };

            TokenRepository.findByRefreshToken.mockResolvedValue(mockToken);

            const result = await TokenService.findToken('test-refresh-token');

            expect(TokenRepository.findByRefreshToken).toHaveBeenCalledWith('test-refresh-token');
            expect(result).toEqual(mockToken);
        });

        it('should throw ApiError if the token is not found', async () => {
            TokenRepository.findByRefreshToken.mockResolvedValue(null);

            await expect(TokenService.findToken('nonexistent-token'))
                .rejects
                .toThrow('Refresh token not found');

            expect(TokenRepository.findByRefreshToken).toHaveBeenCalledWith('nonexistent-token');
        });

        it('should handle database errors when finding', async () => {
            const dbError = new Error('Database connection error');
            TokenRepository.findByRefreshToken.mockRejectedValue(dbError);

            await expect(TokenService.findToken('test-token'))
                .rejects
                .toThrow('Failed to find refresh token');
        });
    });

    describe('removeToken', () => {
        it('should successfully remove a token', async () => {
            TokenRepository.deleteByRefreshToken.mockResolvedValue(1); // one token removed

            const result = await TokenService.removeToken('test-refresh-token');

            expect(TokenRepository.deleteByRefreshToken).toHaveBeenCalledWith('test-refresh-token');
            expect(result).toBe(true);
        });

        it('should throw ApiError if the token is not found for removal', async () => {
            TokenRepository.deleteByRefreshToken.mockResolvedValue(0); // token not found

            await expect(TokenService.removeToken('nonexistent-token'))
                .rejects
                .toThrow('Refresh token not found');

            expect(TokenRepository.deleteByRefreshToken).toHaveBeenCalledWith('nonexistent-token');
        });

        it('should handle database errors when removing', async () => {
            const dbError = new Error('Database connection error');
            TokenRepository.deleteByRefreshToken.mockRejectedValue(dbError);

            await expect(TokenService.removeToken('test-token'))
                .rejects
                .toThrow('Failed to remove refresh token');
        });
    });

    describe('removeUserTokens', () => {
        it('should successfully remove all user tokens', async () => {
            TokenRepository.deleteByUserId.mockResolvedValue(2); // two tokens removed

            const result = await TokenService.removeUserTokens(1);

            expect(TokenRepository.deleteByUserId).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it('should return false if the user has no tokens', async () => {
            TokenRepository.deleteByUserId.mockResolvedValue(0); // tokens not found

            const result = await TokenService.removeUserTokens(999);

            expect(TokenRepository.deleteByUserId).toHaveBeenCalledWith(999);
            expect(result).toBe(false);
        });

        it('should handle database errors when removing user tokens', async () => {
            const dbError = new Error('Database connection error');
            TokenRepository.deleteByUserId.mockRejectedValue(dbError);

            await expect(TokenService.removeUserTokens(1))
                .rejects
                .toThrow('Failed to remove user tokens');
        });
    });

    describe('error handling', () => {
        it('should throw ApiError when saving a token fails', async () => {
            const dbError = new Error('Database error');
            
            TokenRepository.deleteByUserId.mockResolvedValue(0);
            TokenRepository.create.mockRejectedValue(dbError);

            await expect(TokenService.saveToken(1, 'test-token'))
                .rejects
                .toThrow('Failed to save refresh token');
        });

        it('should throw ApiError when finding a token fails', async () => {
            const dbError = new Error('Database error');
            
            TokenRepository.findByRefreshToken.mockRejectedValue(dbError);

            await expect(TokenService.findToken('test-token'))
                .rejects
                .toThrow('Failed to find refresh token');
        });

        it('should throw ApiError when removing a token fails', async () => {
            const dbError = new Error('Database error');
            
            TokenRepository.deleteByRefreshToken.mockRejectedValue(dbError);

            await expect(TokenService.removeToken('test-token'))
                .rejects
                .toThrow('Failed to remove refresh token');
        });

        it('should throw ApiError when removing user tokens fails', async () => {
            const dbError = new Error('Database error');
            
            TokenRepository.deleteByUserId.mockRejectedValue(dbError);

            await expect(TokenService.removeUserTokens(1))
                .rejects
                .toThrow('Failed to remove user tokens');
        });
    });

    describe('type checking', () => {
        it('should correctly handle different input types', async () => {
            const mockToken = {
                id: 1,
                userId: 1,
                refreshToken: 'test-token'
            };

            TokenRepository.deleteByUserId.mockResolvedValue(0);
            TokenRepository.create.mockResolvedValue(mockToken);

            // Test with numeric userId
            await TokenService.saveToken(1, 'test-token');
            expect(TokenRepository.create).toHaveBeenCalledWith({
                userId: 1,
                refreshToken: 'test-token'
            });

            // Test with string userId (should work)
            await TokenService.saveToken('2', 'test-token-2');
            expect(TokenRepository.create).toHaveBeenCalledWith({
                userId: '2',
                refreshToken: 'test-token-2'
            });
        });
    });
}); 