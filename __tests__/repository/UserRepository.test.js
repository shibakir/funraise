const UserRepository = require('../../repository/UserRepository');
const BaseRepository = require('../../repository/BaseRepository');
const { User, Account } = require('../../model');
const { Op } = require('sequelize');
const ApiError = require('../../exception/ApiError');

// Mock models
jest.mock('../../model');

describe('UserRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('inheritance', () => {
        it('should extend BaseRepository', () => {
            expect(UserRepository).toBeInstanceOf(BaseRepository);
            expect(UserRepository.model).toBe(User);
        });
    });

    describe('findByEmail', () => {
        it('should find user by email', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                username: 'testuser'
            };

            User.findOne.mockResolvedValue(mockUser);

            const result = await UserRepository.findByEmail('test@example.com');

            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
            expect(result).toEqual(mockUser);
        });

        it('should return null if user not found', async () => {
            User.findOne.mockResolvedValue(null);

            const result = await UserRepository.findByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findOne.mockRejectedValue(dbError);

            await expect(UserRepository.findByEmail('test@example.com'))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle case sensitivity correctly', async () => {
            User.findOne.mockResolvedValue(null);

            await UserRepository.findByEmail('TEST@EXAMPLE.COM');

            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: 'TEST@EXAMPLE.COM' }
            });
        });

        it('should handle special characters in email', async () => {
            const specialEmail = 'user+tag@example-domain.co.uk';
            User.findOne.mockResolvedValue(null);

            await UserRepository.findByEmail(specialEmail);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: specialEmail }
            });
        });
    });

    describe('findByUsername', () => {
        it('should find user by username', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com'
            };

            User.findOne.mockResolvedValue(mockUser);

            const result = await UserRepository.findByUsername('testuser');

            expect(User.findOne).toHaveBeenCalledWith({
                where: { username: 'testuser' }
            });
            expect(result).toEqual(mockUser);
        });

        it('should return null if user not found', async () => {
            User.findOne.mockResolvedValue(null);

            const result = await UserRepository.findByUsername('nonexistent');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findOne.mockRejectedValue(dbError);

            await expect(UserRepository.findByUsername('testuser'))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle usernames with special characters', async () => {
            const specialUsername = 'user_123';
            User.findOne.mockResolvedValue(null);

            await UserRepository.findByUsername(specialUsername);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { username: specialUsername }
            });
        });
    });

    describe('findByActivationLink', () => {
        it('should find user by activation link', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                activationLink: 'abc123def456'
            };

            User.findOne.mockResolvedValue(mockUser);

            const result = await UserRepository.findByActivationLink('abc123def456');

            expect(User.findOne).toHaveBeenCalledWith({
                where: { activationLink: 'abc123def456' }
            });
            expect(result).toEqual(mockUser);
        });

        it('should return null if user not found', async () => {
            User.findOne.mockResolvedValue(null);

            const result = await UserRepository.findByActivationLink('nonexistent');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findOne.mockRejectedValue(dbError);

            await expect(UserRepository.findByActivationLink('abc123'))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle long activation links', async () => {
            const longLink = 'a'.repeat(255);
            User.findOne.mockResolvedValue(null);

            await UserRepository.findByActivationLink(longLink);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { activationLink: longLink }
            });
        });
    });

    describe('findByEmailOrUsername', () => {
        it('should find user by email or username', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                username: 'testuser'
            };

            User.findOne.mockResolvedValue(mockUser);

            const result = await UserRepository.findByEmailOrUsername('test@example.com', 'testuser');

            expect(User.findOne).toHaveBeenCalledWith({
                where: {
                    [Op.or]: [
                        { email: 'test@example.com' },
                        { username: 'testuser' }
                    ]
                }
            });
            expect(result).toEqual(mockUser);
        });

        it('should find user when only email matches', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                username: 'differentuser'
            };

            User.findOne.mockResolvedValue(mockUser);

            const result = await UserRepository.findByEmailOrUsername('test@example.com', 'nonexistent');

            expect(result).toEqual(mockUser);
        });

        it('should find user when only username matches', async () => {
            const mockUser = {
                id: 1,
                email: 'different@example.com',
                username: 'testuser'
            };

            User.findOne.mockResolvedValue(mockUser);

            const result = await UserRepository.findByEmailOrUsername('nonexistent@example.com', 'testuser');

            expect(result).toEqual(mockUser);
        });

        it('should return null if neither email nor username matches', async () => {
            User.findOne.mockResolvedValue(null);

            const result = await UserRepository.findByEmailOrUsername('nonexistent@example.com', 'nonexistent');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findOne.mockRejectedValue(dbError);

            await expect(UserRepository.findByEmailOrUsername('test@example.com', 'testuser'))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('searchByUsername', () => {
        it('should search users by username with associations', async () => {
            const mockUsers = [
                { id: 1, username: 'testuser1' },
                { id: 2, username: 'testuser2' }
            ];

            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserRepository.searchByUsername('test', true);

            expect(User.findAll).toHaveBeenCalledWith({
                where: {
                    username: {
                        [Op.like]: '%test%'
                    }
                },
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
            expect(result).toEqual(mockUsers);
        });

        it('should search users by username without associations', async () => {
            const mockUsers = [
                { id: 1, username: 'testuser1' },
                { id: 2, username: 'testuser2' }
            ];

            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserRepository.searchByUsername('test', false);

            expect(User.findAll).toHaveBeenCalledWith({
                where: {
                    username: {
                        [Op.like]: '%test%'
                    }
                },
                include: []
            });
            expect(result).toEqual(mockUsers);
        });

        it('should search users by username with default associations', async () => {
            const mockUsers = [{ id: 1, username: 'testuser' }];
            User.findAll.mockResolvedValue(mockUsers);

            await UserRepository.searchByUsername('test');

            expect(User.findAll).toHaveBeenCalledWith({
                where: {
                    username: {
                        [Op.like]: '%test%'
                    }
                },
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
        });

        it('should return empty array if no users found', async () => {
            User.findAll.mockResolvedValue([]);

            const result = await UserRepository.searchByUsername('nonexistent');

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findAll.mockRejectedValue(dbError);

            await expect(UserRepository.searchByUsername('test'))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle special characters in search term', async () => {
            User.findAll.mockResolvedValue([]);

            await UserRepository.searchByUsername('user_123');

            expect(User.findAll).toHaveBeenCalledWith({
                where: {
                    username: {
                        [Op.like]: '%user_123%'
                    }
                },
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
        });
    });

    describe('findByIdWithAssociations', () => {
        it('should find user by ID with associations', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                createdEvents: [],
                receivedEvents: [],
                Accounts: []
            };

            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserRepository.findByIdWithAssociations(1, true);

            expect(User.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' },
                    { model: Account }
                ]
            });
            expect(result).toEqual(mockUser);
        });

        it('should find user by ID without associations', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserRepository.findByIdWithAssociations(1, false);

            expect(User.findByPk).toHaveBeenCalledWith(1, {
                include: []
            });
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiError if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(UserRepository.findByIdWithAssociations(999))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findByPk.mockRejectedValue(dbError);

            await expect(UserRepository.findByIdWithAssociations(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findByIdWithBalance', () => {
        it('should find user by ID with only id and balance attributes', async () => {
            const mockUser = { id: 1, balance: 1000 };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserRepository.findByIdWithBalance(1);

            expect(User.findByPk).toHaveBeenCalledWith(1, {
                attributes: ['id', 'balance']
            });
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiError if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(UserRepository.findByIdWithBalance(999))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findByPk.mockRejectedValue(dbError);

            await expect(UserRepository.findByIdWithBalance(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findAllWithAssociations', () => {
        it('should find all users with associations', async () => {
            const mockUsers = [
                { id: 1, username: 'user1' },
                { id: 2, username: 'user2' }
            ];

            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserRepository.findAllWithAssociations(true);

            expect(User.findAll).toHaveBeenCalledWith({
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
            expect(result).toEqual(mockUsers);
        });

        it('should find all users without associations', async () => {
            const mockUsers = [
                { id: 1, username: 'user1' },
                { id: 2, username: 'user2' }
            ];

            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserRepository.findAllWithAssociations(false);

            expect(User.findAll).toHaveBeenCalledWith({
                include: []
            });
            expect(result).toEqual(mockUsers);
        });

        it('should return empty array if no users found', async () => {
            User.findAll.mockResolvedValue([]);

            const result = await UserRepository.findAllWithAssociations();

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findAll.mockRejectedValue(dbError);

            await expect(UserRepository.findAllWithAssociations())
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('findAllMinimal', () => {
        it('should find all users with only id attribute', async () => {
            const mockUsers = [{ id: 1 }, { id: 2 }, { id: 3 }];
            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserRepository.findAllMinimal();

            expect(User.findAll).toHaveBeenCalledWith({
                attributes: ['id']
            });
            expect(result).toEqual(mockUsers);
        });

        it('should return empty array if no users found', async () => {
            User.findAll.mockResolvedValue([]);

            const result = await UserRepository.findAllMinimal();

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.findAll.mockRejectedValue(dbError);

            await expect(UserRepository.findAllMinimal())
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('updateBalance', () => {
        it('should update user balance', async () => {
            const updateResult = [1];
            User.update.mockResolvedValue(updateResult);

            const result = await UserRepository.updateBalance(1, 1500);

            expect(User.update).toHaveBeenCalledWith(
                { balance: 1500 },
                { where: { id: 1 } }
            );
            expect(result).toEqual(updateResult);
        });

        it('should handle zero balance', async () => {
            const updateResult = [1];
            User.update.mockResolvedValue(updateResult);

            await UserRepository.updateBalance(1, 0);

            expect(User.update).toHaveBeenCalledWith(
                { balance: 0 },
                { where: { id: 1 } }
            );
        });

        it('should handle negative balance', async () => {
            const updateResult = [1];
            User.update.mockResolvedValue(updateResult);

            await UserRepository.updateBalance(1, -100);

            expect(User.update).toHaveBeenCalledWith(
                { balance: -100 },
                { where: { id: 1 } }
            );
        });

        it('should throw ApiError if user not found', async () => {
            User.update.mockResolvedValue([0]);

            await expect(UserRepository.updateBalance(999, 1500))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.update.mockRejectedValue(dbError);

            await expect(UserRepository.updateBalance(1, 1500))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('activate', () => {
        it('should activate user', async () => {
            const updateResult = [1];
            User.update.mockResolvedValue(updateResult);

            const result = await UserRepository.activate(1);

            expect(User.update).toHaveBeenCalledWith(
                {
                    isActivated: true,
                    activationLink: null
                },
                { where: { id: 1 } }
            );
            expect(result).toEqual(updateResult);
        });

        it('should throw ApiError if user not found', async () => {
            User.update.mockResolvedValue([0]);

            await expect(UserRepository.activate(999))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.update.mockRejectedValue(dbError);

            await expect(UserRepository.activate(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('updateActivationLink', () => {
        it('should update activation link', async () => {
            const updateResult = [1];
            const newLink = 'new-activation-link-123';
            User.update.mockResolvedValue(updateResult);

            const result = await UserRepository.updateActivationLink(1, newLink);

            expect(User.update).toHaveBeenCalledWith(
                { activationLink: newLink },
                { where: { id: 1 } }
            );
            expect(result).toEqual(updateResult);
        });

        it('should handle null activation link', async () => {
            const updateResult = [1];
            User.update.mockResolvedValue(updateResult);

            await UserRepository.updateActivationLink(1, null);

            expect(User.update).toHaveBeenCalledWith(
                { activationLink: null },
                { where: { id: 1 } }
            );
        });

        it('should throw ApiError if user not found', async () => {
            User.update.mockResolvedValue([0]);

            await expect(UserRepository.updateActivationLink(999, 'link'))
                .rejects
                .toThrow(ApiError);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection error');
            User.update.mockRejectedValue(dbError);

            await expect(UserRepository.updateActivationLink(1, 'link'))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle empty string searches', async () => {
            User.findAll.mockResolvedValue([]);

            await UserRepository.searchByUsername('');

            expect(User.findAll).toHaveBeenCalledWith({
                where: {
                    username: {
                        [Op.like]: '%%'
                    }
                },
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
        });

        it('should handle very long search terms', async () => {
            const longTerm = 'a'.repeat(1000);
            User.findAll.mockResolvedValue([]);

            await UserRepository.searchByUsername(longTerm);

            expect(User.findAll).toHaveBeenCalledWith({
                where: {
                    username: {
                        [Op.like]: `%${longTerm}%`
                    }
                },
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
        });

        it('should handle null email in findByEmailOrUsername', async () => {
            User.findOne.mockResolvedValue(null);

            await UserRepository.findByEmailOrUsername(null, 'testuser');

            expect(User.findOne).toHaveBeenCalledWith({
                where: {
                    [Op.or]: [
                        { email: null },
                        { username: 'testuser' }
                    ]
                }
            });
        });

        it('should handle null username in findByEmailOrUsername', async () => {
            User.findOne.mockResolvedValue(null);

            await UserRepository.findByEmailOrUsername('test@example.com', null);

            expect(User.findOne).toHaveBeenCalledWith({
                where: {
                    [Op.or]: [
                        { email: 'test@example.com' },
                        { username: null }
                    ]
                }
            });
        });
    });

    describe('data consistency', () => {
        it('should maintain data structure in findByIdWithAssociations', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                balance: 1000,
                isActivated: true,
                createdEvents: [{ id: 1, name: 'Event 1' }],
                receivedEvents: [{ id: 2, name: 'Event 2' }],
                Accounts: [{ id: 'discord_123_1', provider: 'discord' }]
            };

            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserRepository.findByIdWithAssociations(1, true);

            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('username', 'testuser');
            expect(result).toHaveProperty('email', 'test@example.com');
            expect(result).toHaveProperty('balance', 1000);
            expect(result).toHaveProperty('isActivated', true);
            expect(result).toHaveProperty('createdEvents');
            expect(result).toHaveProperty('receivedEvents');
            expect(result).toHaveProperty('Accounts');
            expect(Array.isArray(result.createdEvents)).toBe(true);
            expect(Array.isArray(result.receivedEvents)).toBe(true);
            expect(Array.isArray(result.Accounts)).toBe(true);
        });

        it('should maintain minimal structure in findByIdWithBalance', async () => {
            const mockUser = { id: 1, balance: 500 };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserRepository.findByIdWithBalance(1);

            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('balance', 500);
            expect(Object.keys(result)).toHaveLength(2);
        });
    });
}); 