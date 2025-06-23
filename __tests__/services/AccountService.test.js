const AccountService = require('../../service/AccountService');
const { Account, User } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../model');

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

            Account.findOne.mockResolvedValue(mockAccount);

            const result = await AccountService.findByProviderAndAccountId('discord', '123456');

            expect(Account.findOne).toHaveBeenCalledWith({
                where: {
                    provider: 'discord',
                    providerAccountId: '123456'
                },
                include: [{ model: User }]
            });
            expect(result).toEqual(mockAccount);
        });

        it('should return null if the account is not found', async () => {
            Account.findOne.mockResolvedValue(null);

            const result = await AccountService.findByProviderAndAccountId('discord', 'nonexistent');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Account.findOne.mockRejectedValue(dbError);

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

            Account.findOne.mockResolvedValue(mockAccount);

            const result = await AccountService.findByUserAndProvider(1, 'discord');

            expect(Account.findOne).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    provider: 'discord'
                }
            });
            expect(result).toEqual(mockAccount);
        });

        it('should return null if the account is not found', async () => {
            Account.findOne.mockResolvedValue(null);

            const result = await AccountService.findByUserAndProvider(999, 'discord');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            Account.findOne.mockRejectedValue(dbError);

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

            Account.create.mockResolvedValue(accountData);

            const result = await AccountService.create(accountData);

            expect(Account.create).toHaveBeenCalledWith(accountData);
            expect(result).toEqual(accountData);
        });

        it('should handle errors when creating an account', async () => {
            const accountData = {
                id: 'discord_123456_1',
                userId: 1,
                provider: 'discord'
            };

            const dbError = new Error('Constraint violation');
            Account.create.mockRejectedValue(dbError);

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
                access_token: 'old-token',
                update: jest.fn().mockResolvedValue()
            };

            const updateData = {
                access_token: 'new-token',
                providerUsername: 'newusername'
            };

            Account.findByPk.mockResolvedValue(mockAccount);

            const result = await AccountService.update('discord_123456_1', updateData);

            expect(Account.findByPk).toHaveBeenCalledWith('discord_123456_1');
            expect(mockAccount.update).toHaveBeenCalledWith(updateData);
            expect(result).toEqual(mockAccount);
        });

        it('should throw an error if the account is not found for update', async () => {
            Account.findByPk.mockResolvedValue(null);

            await expect(AccountService.update('nonexistent', { access_token: 'new-token' }))
                .rejects
                .toThrow('Account not found');
        });

        it('should handle database errors when updating', async () => {
            const dbError = new Error('Database error');
            Account.findByPk.mockRejectedValue(dbError);

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

            Account.update.mockResolvedValue([1]); // one account updated
            Account.findOne.mockResolvedValue(updatedAccount);

            const result = await AccountService.updateByProviderAndAccountId('discord', '123456', updateData);

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

        it('should throw an error if the account is not found for update', async () => {
            Account.update.mockResolvedValue([0]); // no accounts found for update

            await expect(AccountService.updateByProviderAndAccountId('discord', 'nonexistent', { access_token: 'new-token' }))
                .rejects
                .toThrow('Account not found');
        });

        it('should handle database errors when updating', async () => {
            const dbError = new Error('Database constraint error');
            Account.update.mockRejectedValue(dbError);

            await expect(AccountService.updateByProviderAndAccountId('discord', '123456', { access_token: 'new-token' }))
                .rejects
                .toThrow('Error updating account by provider and account ID');
        });
    });

    describe('error handling', () => {
        it('should correctly handle ApiError in update', async () => {
            const apiError = ApiError.notFound('Account not found');
            const mockAccount = {
                update: jest.fn().mockRejectedValue(apiError)
            };

            Account.findByPk.mockResolvedValue(mockAccount);

            await expect(AccountService.update('test-id', { access_token: 'new-token' }))
                .rejects
                .toThrow('Account not found');
        });

        it('should correctly handle ApiError in updateByProviderAndAccountId', async () => {
            const apiError = ApiError.notFound('Account not found');
            Account.update.mockResolvedValue([0]);

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

            Account.create.mockResolvedValue(accountData);

            const result = await AccountService.create(accountData);

            expect(Account.create).toHaveBeenCalledWith(accountData);
            expect(result).toEqual(accountData);
        });

        it('should correctly update only passed fields', async () => {
            const mockAccount = {
                id: 'discord_123456_1',
                provider: 'discord',
                access_token: 'old-token',
                providerUsername: 'oldusername',
                update: jest.fn().mockResolvedValue()
            };

            const partialUpdateData = {
                access_token: 'new-token'
                // providerUsername is not updated
            };

            Account.findByPk.mockResolvedValue(mockAccount);

            await AccountService.update('discord_123456_1', partialUpdateData);

            expect(mockAccount.update).toHaveBeenCalledWith(partialUpdateData);
            expect(mockAccount.update).not.toHaveBeenCalledWith(expect.objectContaining({
                providerUsername: expect.anything()
            }));
        });
    });
}); 