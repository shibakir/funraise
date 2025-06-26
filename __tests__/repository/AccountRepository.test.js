const AccountRepository = require('../../repository/AccountRepository');
const BaseRepository = require('../../repository/BaseRepository');
const { Account, User } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock models
jest.mock('../../model');

describe('AccountRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('inheritance', () => {
        it('should extend BaseRepository', () => {
            expect(AccountRepository).toBeInstanceOf(BaseRepository);
            expect(AccountRepository.model).toBe(Account);
        });
    });

    describe('findByProviderAndAccountId', () => {
        it('should find account by provider and account ID with user', async () => {
            const mockAccount = {
                id: 'discord_123456_1',
                provider: 'discord',
                providerAccountId: '123456',
                userId: 1,
                User: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com'
                }
            };

            Account.findOne.mockResolvedValue(mockAccount);

            const result = await AccountRepository.findByProviderAndAccountId('discord', '123456');

            expect(Account.findOne).toHaveBeenCalledWith({
                where: {
                    provider: 'discord',
                    providerAccountId: '123456'
                },
                include: [{ model: User }]
            });
            expect(result).toEqual(mockAccount);
        });

        it('should return null if account not found', async () => {
            Account.findOne.mockResolvedValue(null);

            const result = await AccountRepository.findByProviderAndAccountId('github', 'nonexistent');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Account.findOne.mockRejectedValue(dbError);

            await expect(AccountRepository.findByProviderAndAccountId('discord', '123456'))
                .rejects
                .toThrow(ApiError);
        });

        it('should work with different providers', async () => {
            const providers = ['discord', 'google', 'github', 'facebook'];
            
            for (const provider of providers) {
                Account.findOne.mockResolvedValue(null);
                
                await AccountRepository.findByProviderAndAccountId(provider, 'test123');
                
                expect(Account.findOne).toHaveBeenCalledWith({
                    where: {
                        provider: provider,
                        providerAccountId: 'test123'
                    },
                    include: [{ model: User }]
                });
            }
        });
    });

    describe('findByUserAndProvider', () => {
        it('should find account by user ID and provider', async () => {
            const mockAccount = {
                id: 'discord_123456_1',
                provider: 'discord',
                providerAccountId: '123456',
                userId: 1
            };

            Account.findOne.mockResolvedValue(mockAccount);

            const result = await AccountRepository.findByUserAndProvider(1, 'discord');

            expect(Account.findOne).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    provider: 'discord'
                }
            });
            expect(result).toEqual(mockAccount);
        });

        it('should return null if account not found', async () => {
            Account.findOne.mockResolvedValue(null);

            const result = await AccountRepository.findByUserAndProvider(999, 'discord');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Account.findOne.mockRejectedValue(dbError);

            await expect(AccountRepository.findByUserAndProvider(1, 'discord'))
                .rejects
                .toThrow(ApiError);
        });

        it('should work with different user IDs and providers', async () => {
            const testCases = [
                { userId: 1, provider: 'discord' },
                { userId: 2, provider: 'google' },
                { userId: 100, provider: 'github' }
            ];

            for (const testCase of testCases) {
                Account.findOne.mockResolvedValue(null);
                
                await AccountRepository.findByUserAndProvider(testCase.userId, testCase.provider);
                
                expect(Account.findOne).toHaveBeenCalledWith({
                    where: {
                        userId: testCase.userId,
                        provider: testCase.provider
                    }
                });
            }
        });
    });

    describe('updateByProviderAndAccountId', () => {
        it('should update account by provider and account ID', async () => {
            const updateData = {
                access_token: 'new-access-token',
                providerUsername: 'newusername'
            };

            const updatedAccount = {
                id: 'discord_123456_1',
                provider: 'discord',
                providerAccountId: '123456',
                ...updateData,
                User: {
                    id: 1,
                    username: 'testuser'
                }
            };

            Account.update.mockResolvedValue([1]); // One record updated
            Account.findOne.mockResolvedValue(updatedAccount);

            const result = await AccountRepository.updateByProviderAndAccountId('discord', '123456', updateData);

            expect(Account.update).toHaveBeenCalledWith(updateData, {
                where: {
                    provider: 'discord',
                    providerAccountId: '123456'
                }
            });
            expect(Account.findOne).toHaveBeenCalledWith({
                where: {
                    provider: 'discord',
                    providerAccountId: '123456'
                },
                include: [{ model: User }]
            });
            expect(result).toEqual(updatedAccount);
        });

        it('should throw ApiError if account not found for update', async () => {
            const updateData = { access_token: 'new-token' };
            Account.update.mockResolvedValue([0]); // No records updated

            await expect(AccountRepository.updateByProviderAndAccountId('discord', 'nonexistent', updateData))
                .rejects
                .toThrow(ApiError);

            try {
                await AccountRepository.updateByProviderAndAccountId('discord', 'nonexistent', updateData);
            } catch (error) {
                expect(error.message).toBe('Account not found');
            }
        });

        it('should handle database errors during update', async () => {
            const updateData = { access_token: 'new-token' };
            const dbError = new Error('Database constraint error');
            Account.update.mockRejectedValue(dbError);

            await expect(AccountRepository.updateByProviderAndAccountId('discord', '123456', updateData))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle multiple field updates', async () => {
            const updateData = {
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                providerUsername: 'newusername',
                providerEmail: 'new@example.com',
                providerAvatar: 'https://example.com/new-avatar.jpg'
            };

            Account.update.mockResolvedValue([1]);
            Account.findOne.mockResolvedValue({ id: 'test', ...updateData });

            await AccountRepository.updateByProviderAndAccountId('discord', '123456', updateData);

            expect(Account.update).toHaveBeenCalledWith(updateData, {
                where: {
                    provider: 'discord',
                    providerAccountId: '123456'
                }
            });
        });
    });

    describe('findByUserId', () => {
        it('should find all accounts for a user', async () => {
            const mockAccounts = [
                {
                    id: 'discord_123_1',
                    userId: 1,
                    provider: 'discord'
                },
                {
                    id: 'google_456_1',
                    userId: 1,
                    provider: 'google'
                }
            ];

            Account.findAll.mockResolvedValue(mockAccounts);

            const result = await AccountRepository.findByUserId(1);

            expect(Account.findAll).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
            expect(result).toEqual(mockAccounts);
        });

        it('should return empty array if no accounts found', async () => {
            Account.findAll.mockResolvedValue([]);

            const result = await AccountRepository.findByUserId(999);

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database error');
            Account.findAll.mockRejectedValue(dbError);

            await expect(AccountRepository.findByUserId(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle null/undefined parameters gracefully', async () => {
            Account.findOne.mockResolvedValue(null);

            // Test with null values
            await AccountRepository.findByProviderAndAccountId(null, null);
            await AccountRepository.findByUserAndProvider(null, null);

            expect(Account.findOne).toHaveBeenCalledTimes(2);
        });

        it('should handle empty string parameters', async () => {
            Account.findOne.mockResolvedValue(null);

            await AccountRepository.findByProviderAndAccountId('', '');

            expect(Account.findOne).toHaveBeenCalledWith({
                where: {
                    provider: '',
                    providerAccountId: ''
                },
                include: [{ model: User }]
            });
        });

        it('should handle very long provider account IDs', async () => {
            const longAccountId = 'a'.repeat(1000);
            Account.findOne.mockResolvedValue(null);

            await AccountRepository.findByProviderAndAccountId('discord', longAccountId);

            expect(Account.findOne).toHaveBeenCalledWith({
                where: {
                    provider: 'discord',
                    providerAccountId: longAccountId
                },
                include: [{ model: User }]
            });
        });

        it('should handle special characters in provider account IDs', async () => {
            const specialAccountId = 'user@domain.com#special&chars';
            Account.findOne.mockResolvedValue(null);

            await AccountRepository.findByProviderAndAccountId('oauth', specialAccountId);

            expect(Account.findOne).toHaveBeenCalledWith({
                where: {
                    provider: 'oauth',
                    providerAccountId: specialAccountId
                },
                include: [{ model: User }]
            });
        });
    });

    describe('data integrity and validation', () => {
        it('should maintain correct data structure in responses', async () => {
            const expectedAccount = {
                id: 'discord_123_1',
                provider: 'discord',
                providerAccountId: '123',
                userId: 1,
                type: 'oauth',
                access_token: 'token123',
                providerUsername: 'testuser',
                User: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com'
                }
            };

            Account.findOne.mockResolvedValue(expectedAccount);

            const result = await AccountRepository.findByProviderAndAccountId('discord', '123');

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('provider', 'discord');
            expect(result).toHaveProperty('providerAccountId', '123');
            expect(result).toHaveProperty('userId', 1);
            expect(result).toHaveProperty('User');
            expect(result.User).toHaveProperty('id');
            expect(result.User).toHaveProperty('username');
            expect(result.User).toHaveProperty('email');
        });

        it('should handle update response correctly', async () => {
            const updateData = { access_token: 'new-token' };
            const mockUpdatedAccount = {
                id: 'test_123_1',
                ...updateData
            };

            Account.update.mockResolvedValue([1]);
            Account.findOne.mockResolvedValue(mockUpdatedAccount);

            const result = await AccountRepository.updateByProviderAndAccountId('test', '123', updateData);

            expect(result).toEqual(mockUpdatedAccount);
            expect(result.access_token).toBe('new-token');
        });
    });
}); 
