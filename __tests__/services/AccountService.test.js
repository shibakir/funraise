// Mock dependencies
jest.mock('../../repository', () => ({
    AccountRepository: {
        findByProviderAndAccountId: jest.fn(),
        findByUserAndProvider: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        update: jest.fn(),
        updateByProviderAndAccountId: jest.fn()
    }
}));

const AccountService = require('../../service/AccountService');
const { AccountRepository } = require('../../repository');
const ApiError = require('../../exception/ApiError');

describe('AccountService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findByProviderAndAccountId', () => {
        it('should find an account by provider and account ID', async () => {
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

            AccountRepository.findByProviderAndAccountId.mockResolvedValue(mockAccount);

            const result = await AccountService.findByProviderAndAccountId('discord', '123456');

            expect(AccountRepository.findByProviderAndAccountId).toHaveBeenCalledWith('discord', '123456');
            expect(result).toEqual(mockAccount);
        });

        it('should return null if the account is not found', async () => {
            AccountRepository.findByProviderAndAccountId.mockResolvedValue(null);

            const result = await AccountService.findByProviderAndAccountId('discord', 'nonexistent');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            AccountRepository.findByProviderAndAccountId.mockRejectedValue(dbError);

            await expect(AccountService.findByProviderAndAccountId('discord', '123456'))
                .rejects
                .toThrow('Error finding account by provider and account ID');
        });
    });

    describe('findByUserAndProvider', () => {
        it('should find an account by user and provider', async () => {
            const mockAccount = {
                id: 'discord_123456_1',
                provider: 'discord',
                providerAccountId: '123456',
                userId: 1
            };

            AccountRepository.findByUserAndProvider.mockResolvedValue(mockAccount);

            const result = await AccountService.findByUserAndProvider(1, 'discord');

            expect(AccountRepository.findByUserAndProvider).toHaveBeenCalledWith(1, 'discord');
            expect(result).toEqual(mockAccount);
        });

        it('should return null if the account is not found', async () => {
            AccountRepository.findByUserAndProvider.mockResolvedValue(null);

            const result = await AccountService.findByUserAndProvider(999, 'discord');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            AccountRepository.findByUserAndProvider.mockRejectedValue(dbError);

            await expect(AccountService.findByUserAndProvider(1, 'discord'))
                .rejects
                .toThrow('Error finding account by user and provider');
        });
    });

    describe('create', () => {
        it('should successfully create a new account', async () => {
            const accountData = {
                id: 'discord_123456_1',
                userId: 1,
                type: 'oauth',
                provider: 'discord',
                providerAccountId: '123456',
                access_token: 'access-token-123',
                providerUsername: 'testuser',
                providerEmail: 'test@example.com'
            };

            AccountRepository.create.mockResolvedValue(accountData);

            const result = await AccountService.create(accountData);

            expect(AccountRepository.create).toHaveBeenCalledWith(accountData);
            expect(result).toEqual(accountData);
        });

        it('should handle errors when creating an account', async () => {
            const accountData = {
                id: 'discord_123456_1',
                userId: 1,
                provider: 'discord'
            };

            const dbError = new Error('Constraint violation');
            AccountRepository.create.mockRejectedValue(dbError);

            await expect(AccountService.create(accountData))
                .rejects
                .toThrow('Error creating account');
        });
    });

    describe('update', () => {
        it('should successfully update an account', async () => {
            const mockAccount = {
                id: 'discord_123456_1',
                provider: 'discord',
                access_token: 'old-token'
            };

            const updatedAccount = {
                id: 'discord_123456_1',
                provider: 'discord',
                access_token: 'new-token',
                providerUsername: 'newusername'
            };

            const updateData = {
                access_token: 'new-token',
                providerUsername: 'newusername'
            };

            AccountRepository.findByPk.mockResolvedValueOnce(mockAccount).mockResolvedValueOnce(updatedAccount);
            AccountRepository.update.mockResolvedValue([1]);

            const result = await AccountService.update('discord_123456_1', updateData);

            expect(AccountRepository.findByPk).toHaveBeenCalledWith('discord_123456_1');
            expect(AccountRepository.update).toHaveBeenCalledWith('discord_123456_1', updateData);
            expect(result).toEqual(updatedAccount);
        });

        it('should throw an error if the account is not found for update', async () => {
            AccountRepository.findByPk.mockResolvedValue(null);

            await expect(AccountService.update('nonexistent', { access_token: 'new-token' }))
                .rejects
                .toThrow('Account not found');
        });

        it('should handle database errors when updating', async () => {
            const dbError = new Error('Database error');
            AccountRepository.findByPk.mockRejectedValue(dbError);

            await expect(AccountService.update('discord_123456_1', { access_token: 'new-token' }))
                .rejects
                .toThrow('Error updating account');
        });
    });

    describe('updateByProviderAndAccountId', () => {
        it('should successfully update an account by provider and account ID', async () => {
            const updateData = {
                access_token: 'new-token',
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

            AccountRepository.updateByProviderAndAccountId.mockResolvedValue(updatedAccount);

            const result = await AccountService.updateByProviderAndAccountId('discord', '123456', updateData);

            expect(AccountRepository.updateByProviderAndAccountId).toHaveBeenCalledWith('discord', '123456', updateData);
            expect(result).toEqual(updatedAccount);
        });

        it('should handle database errors when updating', async () => {
            const dbError = new Error('Database constraint error');
            AccountRepository.updateByProviderAndAccountId.mockRejectedValue(dbError);

            await expect(AccountService.updateByProviderAndAccountId('discord', '123456', { access_token: 'new-token' }))
                .rejects
                .toThrow('Error updating account by provider and account ID');
        });
    });

    describe('error handling', () => {
        it('should correctly handle ApiError in update', async () => {
            const apiError = ApiError.notFound('Account not found');
            AccountRepository.findByPk.mockRejectedValue(apiError);

            await expect(AccountService.update('test-id', { access_token: 'new-token' }))
                .rejects
                .toThrow('Account not found');
        });

        it('should correctly handle ApiError in updateByProviderAndAccountId', async () => {
            const apiError = ApiError.notFound('Account not found');
            AccountRepository.updateByProviderAndAccountId.mockRejectedValue(apiError);

            await expect(AccountService.updateByProviderAndAccountId('discord', 'nonexistent', { access_token: 'new-token' }))
                .rejects
                .toThrow('Account not found');
        });
    });

    describe('data integrity', () => {
        it('should correctly pass all fields when creating an account', async () => {
            const accountData = {
                id: 'github_987654_2',
                userId: 2,
                type: 'oauth',
                provider: 'github',
                providerAccountId: '987654',
                access_token: 'github-access-token',
                refresh_token: 'github-refresh-token',
                providerUsername: 'githubuser',
                providerEmail: 'github@example.com',
                providerAvatar: 'https://github.com/avatar.jpg'
            };

            AccountRepository.create.mockResolvedValue(accountData);

            const result = await AccountService.create(accountData);

            expect(AccountRepository.create).toHaveBeenCalledWith(accountData);
            expect(result).toEqual(accountData);
        });
    });
}); 