const TokenService = require('../../service/TokenService');
const { Token } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../model');

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

            Token.destroy.mockResolvedValue(0); // old token not found
            Token.create.mockResolvedValue(mockToken);

            const result = await TokenService.saveToken(1, 'test-refresh-token');

            expect(Token.destroy).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
            expect(Token.create).toHaveBeenCalledWith({
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

            Token.destroy.mockResolvedValue(1); // old token found and deleted
            Token.create.mockResolvedValue(mockToken);

            const result = await TokenService.saveToken(1, 'new-refresh-token');

            expect(Token.destroy).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
            expect(Token.create).toHaveBeenCalledWith({
                userId: 1,
                refreshToken: 'new-refresh-token'
            });
            expect(result).toEqual(mockToken);
        });

        it('should handle database errors when saving', async () => {
            const dbError = new Error('Database connection error');
            Token.destroy.mockResolvedValue(0);
            Token.create.mockRejectedValue(dbError);

            await expect(TokenService.saveToken(1, 'test-token'))
                .rejects
                .toThrow('Failed to save refresh token');
        });

        it('should handle errors when deleting the old token', async () => {
            const dbError = new Error('Database connection error');
            Token.destroy.mockRejectedValue(dbError);

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

            Token.findOne.mockResolvedValue(mockToken);

            const result = await TokenService.findToken('test-refresh-token');

            expect(Token.findOne).toHaveBeenCalledWith({
                where: { refreshToken: 'test-refresh-token' }
            });
            expect(result).toEqual(mockToken);
        });

        it('should return null if the token is not found', async () => {
            Token.findOne.mockResolvedValue(null);

            const result = await TokenService.findToken('nonexistent-token');

            expect(Token.findOne).toHaveBeenCalledWith({
                where: { refreshToken: 'nonexistent-token' }
            });
            expect(result).toBeNull();
        });

        it('should handle database errors when finding', async () => {
            const dbError = new Error('Database connection error');
            Token.findOne.mockRejectedValue(dbError);

            await expect(TokenService.findToken('test-token'))
                .rejects
                .toThrow('Failed to find refresh token');
        });
    });

    describe('removeToken', () => {
        it('should successfully remove a token', async () => {
            Token.destroy.mockResolvedValue(1); // one token removed

            const result = await TokenService.removeToken('test-refresh-token');

            expect(Token.destroy).toHaveBeenCalledWith({
                where: { refreshToken: 'test-refresh-token' }
            });
            expect(result).toBe(true);
        });

        it('should return false if the token is not found for removal', async () => {
            Token.destroy.mockResolvedValue(0); // token not found

            const result = await TokenService.removeToken('nonexistent-token');

            expect(Token.destroy).toHaveBeenCalledWith({
                where: { refreshToken: 'nonexistent-token' }
            });
            expect(result).toBe(false);
        });

        it('should handle database errors when removing', async () => {
            const dbError = new Error('Database connection error');
            Token.destroy.mockRejectedValue(dbError);

            await expect(TokenService.removeToken('test-token'))
                .rejects
                .toThrow('Failed to remove refresh token');
        });
    });

    describe('removeUserTokens', () => {
        it('should successfully remove all user tokens', async () => {
            Token.destroy.mockResolvedValue(2); // two tokens removed

            const result = await TokenService.removeUserTokens(1);

            expect(Token.destroy).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
            expect(result).toBe(true);
        });

        it('should return false if the user has no tokens', async () => {
            Token.destroy.mockResolvedValue(0); // tokens not found

            const result = await TokenService.removeUserTokens(999);

            expect(Token.destroy).toHaveBeenCalledWith({
                where: { userId: 999 }
            });
            expect(result).toBe(false);
        });

        it('should handle database errors when removing user tokens', async () => {
            const dbError = new Error('Database connection error');
            Token.destroy.mockRejectedValue(dbError);

            await expect(TokenService.removeUserTokens(1))
                .rejects
                .toThrow('Failed to remove user tokens');
        });
    });

    describe('error handling', () => {
        it('should log errors when saving a token', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const dbError = new Error('Database error');
            
            Token.destroy.mockResolvedValue(0);
            Token.create.mockRejectedValue(dbError);

            await expect(TokenService.saveToken(1, 'test-token'))
                .rejects
                .toThrow('Failed to save refresh token');

            expect(consoleSpy).toHaveBeenCalledWith('Error saving token:', dbError);
            consoleSpy.mockRestore();
        });

        it('should log errors when finding a token', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const dbError = new Error('Database error');
            
            Token.findOne.mockRejectedValue(dbError);

            await expect(TokenService.findToken('test-token'))
                .rejects
                .toThrow('Failed to find refresh token');

            expect(consoleSpy).toHaveBeenCalledWith('Error finding token:', dbError);
            consoleSpy.mockRestore();
        });

        it('should log errors when removing a token', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const dbError = new Error('Database error');
            
            Token.destroy.mockRejectedValue(dbError);

            await expect(TokenService.removeToken('test-token'))
                .rejects
                .toThrow('Failed to remove refresh token');

            expect(consoleSpy).toHaveBeenCalledWith('Error removing token:', dbError);
            consoleSpy.mockRestore();
        });

        it('should log errors when removing user tokens', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const dbError = new Error('Database error');
            
            Token.destroy.mockRejectedValue(dbError);

            await expect(TokenService.removeUserTokens(1))
                .rejects
                .toThrow('Failed to remove user tokens');

            expect(consoleSpy).toHaveBeenCalledWith('Error removing user tokens:', dbError);
            consoleSpy.mockRestore();
        });
    });

    describe('type checking', () => {
        it('should correctly handle different input types', async () => {
            const mockToken = {
                id: 1,
                userId: 1,
                refreshToken: 'test-token'
            };

            Token.destroy.mockResolvedValue(0);
            Token.create.mockResolvedValue(mockToken);

            // Test with numeric userId
            await TokenService.saveToken(1, 'test-token');
            expect(Token.create).toHaveBeenCalledWith({
                userId: 1,
                refreshToken: 'test-token'
            });

            // Test with string userId (should work)
            await TokenService.saveToken('2', 'test-token-2');
            expect(Token.create).toHaveBeenCalledWith({
                userId: '2',
                refreshToken: 'test-token-2'
            });
        });
    });
}); 