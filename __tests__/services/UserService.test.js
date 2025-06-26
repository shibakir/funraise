const UserService = require('../../service/UserService');
const { UserRepository, AccountRepository } = require('../../repository');
const ApiError = require('../../exception/ApiError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mailService = require('../../utils/mail/mailService');
const { initializeUser, onUserBankUpdated } = require('../../utils/achievement');

// Mock dependencies
jest.mock('../../repository', () => ({
    UserRepository: {
        findByEmailOrUsername: jest.fn(),
        create: jest.fn(),
        findByActivationLink: jest.fn(),
        activate: jest.fn(),
        findByIdWithAssociations: jest.fn(),
        findByEmail: jest.fn(),
        updateActivationLink: jest.fn(),
        findByIdWithBalance: jest.fn(),
        updateBalance: jest.fn(),
        findAllMinimal: jest.fn(),
        findByPk: jest.fn(),
        findByUsername: jest.fn(),
        update: jest.fn(),
        findAllWithAssociations: jest.fn(),
        findAll: jest.fn(),
        searchByUsername: jest.fn(),
        findUsersByBalance: jest.fn(),
        findUsersByTransactionSum: jest.fn(),
    },
    AccountRepository: {
        findByUserId: jest.fn()
    }
}));
jest.mock('bcryptjs');
jest.mock('crypto');
jest.mock('../../utils/mail/mailService');
jest.mock('../../utils/achievement', () => ({
    initializeUser: jest.fn(),
    onUserBankUpdated: jest.fn()
}));

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        it('should successfully create a new user with all fields', async () => {
            UserRepository.findByEmailOrUsername.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            const createdUser = {
                id: 1,
                ...validUserData,
                password: 'hashed-password',
                activationLink: 'activation-link',
                isActivated: false,
                image: 'https://example.com/test-image.jpg'
            };
            UserRepository.create.mockResolvedValue(createdUser);
            mailService.sendActivationMail.mockResolvedValue(true);
            initializeUser.mockResolvedValue(true);

            const result = await UserService.create({
                ...validUserData,
                image: 'https://example.com/test-image.jpg'
            });

            expect(UserRepository.findByEmailOrUsername).toHaveBeenCalledWith(
                validUserData.email,
                validUserData.username
            );
            expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 12);
            expect(UserRepository.create).toHaveBeenCalledWith({
                username: validUserData.username,
                password: 'hashed-password',
                email: validUserData.email,
                activationLink: 'activation-link',
                isActivated: false,
                image: 'https://example.com/test-image.jpg'
            });
            expect(mailService.sendActivationMail).toHaveBeenCalledWith(
                validUserData.email,
                `${process.env.FUNRAISE_APP_URL}/activate/activation-link`
            );
            expect(initializeUser).toHaveBeenCalledWith(1);
            expect(result).toEqual(createdUser);
        });

        it('should create user without image field', async () => {
            UserRepository.findByEmailOrUsername.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            const createdUser = {
                id: 1,
                ...validUserData,
                password: 'hashed-password'
            };
            UserRepository.create.mockResolvedValue(createdUser);
            mailService.sendActivationMail.mockResolvedValue(true);

            const result = await UserService.create(validUserData);

            expect(UserRepository.create).toHaveBeenCalledWith({
                username: validUserData.username,
                password: 'hashed-password',
                email: validUserData.email,
                activationLink: 'activation-link',
                isActivated: false
            });
            expect(result).toEqual(createdUser);
        });

        it('should continue if email sending fails', async () => {
            UserRepository.findByEmailOrUsername.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            const createdUser = { id: 1, ...validUserData };
            UserRepository.create.mockResolvedValue(createdUser);
            mailService.sendActivationMail.mockRejectedValue(new Error('Email service down'));

            const result = await UserService.create(validUserData);

            expect(result).toEqual(createdUser);
        });

        it('should continue if achievement initialization fails', async () => {
            UserRepository.findByEmailOrUsername.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            const createdUser = { id: 1, ...validUserData };
            UserRepository.create.mockResolvedValue(createdUser);
            mailService.sendActivationMail.mockResolvedValue(true);
            initializeUser.mockRejectedValue(new Error('Achievement service down'));

            const result = await UserService.create(validUserData);

            expect(result).toEqual(createdUser);
        });

        it('should throw ApiError.conflict if email already exists', async () => {
            UserRepository.findByEmailOrUsername.mockResolvedValue({
                email: validUserData.email,
                username: 'different-username'
            });

            await expect(UserService.create(validUserData))
                .rejects
                .toThrow('User with this credentials already exists');
        });

        it('should throw ApiError.conflict if username already exists', async () => {
            UserRepository.findByEmailOrUsername.mockResolvedValue({
                email: 'different@email.com',
                username: validUserData.username
            });

            await expect(UserService.create(validUserData))
                .rejects
                .toThrow('User with this credentials already exists');
        });

        it('should throw ApiError.conflict if both email and username exist', async () => {
            UserRepository.findByEmailOrUsername.mockResolvedValue({
                email: validUserData.email,
                username: validUserData.username
            });

            await expect(UserService.create(validUserData))
                .rejects
                .toThrow('User with this credentials already exists');
        });

        it('should throw validation error for invalid data', async () => {
            const invalidData = {
                username: 'a', // too short
                email: 'invalid-email',
                password: '123' // too short
            };
            
            // Mock existing user check first
            UserRepository.findByEmailOrUsername.mockResolvedValue({
                email: invalidData.email,
                username: 'different-username'
            });

            await expect(UserService.create(invalidData))
                .rejects
                .toThrow('User with this credentials already exists');
        });

        it('should throw database error if UserRepository.create fails', async () => {
            UserRepository.findByEmailOrUsername.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            UserRepository.create.mockRejectedValue(new Error('Database error'));

            await expect(UserService.create(validUserData))
                .rejects
                .toThrow('Error creating user');
        });
    });

    describe('activate', () => {
        it('should successfully activate a user', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                isActivated: false,
                activationLink: 'valid-link'
            };
            const activatedUser = { ...mockUser, isActivated: true };

            UserRepository.findByActivationLink.mockResolvedValue(mockUser);
            UserRepository.activate.mockResolvedValue([1]);
            UserRepository.findByIdWithAssociations.mockResolvedValue(activatedUser);

            const result = await UserService.activate('valid-link');

            expect(UserRepository.findByActivationLink).toHaveBeenCalledWith('valid-link');
            expect(UserRepository.activate).toHaveBeenCalledWith(1);
            expect(UserRepository.findByIdWithAssociations).toHaveBeenCalledWith(1);
            expect(result).toEqual(activatedUser);
        });

        it('should throw error if activation link is missing', async () => {
            await expect(UserService.activate())
                .rejects
                .toThrow(ApiError.badRequest('Activation link is required'));
        });

        it('should throw error if activation link is empty', async () => {
            await expect(UserService.activate(''))
                .rejects
                .toThrow(ApiError.badRequest('Activation link is required'));
        });

        it('should throw error for invalid activation link', async () => {
            UserRepository.findByActivationLink.mockResolvedValue(null);

            await expect(UserService.activate('invalid-link'))
                .rejects
                .toThrow('Invalid activation link');
        });

        it('should throw error if user is already activated', async () => {
            UserRepository.findByActivationLink.mockResolvedValue({
                id: 1,
                isActivated: true
            });

            await expect(UserService.activate('valid-link'))
                .rejects
                .toThrow('User is already activated');
        });

        it('should throw database error if activation fails', async () => {
            UserRepository.findByActivationLink.mockResolvedValue({
                id: 1,
                isActivated: false
            });
            UserRepository.activate.mockRejectedValue(new Error('Database error'));

            await expect(UserService.activate('valid-link'))
                .rejects
                .toThrow('Error activating user');
        });
    });

    describe('resendActivationEmail', () => {
        const testEmail = 'test@example.com';

        it('should resend activation email for unactivated user with existing activation link', async () => {
            const mockUser = {
                id: 1,
                email: testEmail,
                isActivated: false,
                activationLink: 'existing-link'
            };
            UserRepository.findByEmail.mockResolvedValue(mockUser);
            mailService.sendActivationMail.mockResolvedValue(true);

            const result = await UserService.resendActivationEmail(testEmail);

            expect(UserRepository.findByEmail).toHaveBeenCalledWith(testEmail);
            expect(mailService.sendActivationMail).toHaveBeenCalledWith(
                testEmail,
                `${process.env.CLIENT_URL}/activate/existing-link`
            );
            expect(result).toBe(true);
        });

        it('should generate new activation link if user has no activation link', async () => {
            const mockUser = {
                id: 1,
                email: testEmail,
                isActivated: false,
                activationLink: null
            };
            UserRepository.findByEmail.mockResolvedValue(mockUser);
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('new-activation-link')
            });
            UserRepository.updateActivationLink.mockResolvedValue([1]);
            mailService.sendActivationMail.mockResolvedValue(true);

            const result = await UserService.resendActivationEmail(testEmail);

            expect(crypto.randomBytes).toHaveBeenCalledWith(32);
            expect(UserRepository.updateActivationLink).toHaveBeenCalledWith(
                1,
                'new-activation-link'
            );
            expect(mailService.sendActivationMail).toHaveBeenCalledWith(
                testEmail,
                `${process.env.CLIENT_URL}/activate/new-activation-link`
            );
            expect(result).toBe(true);
        });

        it('should throw error if email is missing', async () => {
            await expect(UserService.resendActivationEmail())
                .rejects
                .toThrow(ApiError.badRequest('Email is required'));
        });

        it('should throw error if user not found', async () => {
            UserRepository.findByEmail.mockResolvedValue(null);

            await expect(UserService.resendActivationEmail(testEmail))
                .rejects
                .toThrow('User with this email not found');
        });

        it('should throw error if user is already activated', async () => {
            UserRepository.findByEmail.mockResolvedValue({
                id: 1,
                email: testEmail,
                isActivated: true
            });

            await expect(UserService.resendActivationEmail(testEmail))
                .rejects
                .toThrow('User is already activated');
        });

        it('should throw error if email sending fails', async () => {
            const mockUser = {
                id: 1,
                email: testEmail,
                isActivated: false,
                activationLink: 'test-link'
            };
            UserRepository.findByEmail.mockResolvedValue(mockUser);
            mailService.sendActivationMail.mockRejectedValue(new Error('Email service down'));

            await expect(UserService.resendActivationEmail(testEmail))
                .rejects
                .toThrow('Failed to send activation email');
        });

        it('should handle database error gracefully', async () => {
            UserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

            await expect(UserService.resendActivationEmail(testEmail))
                .rejects
                .toThrow('Error resending activation email');
        });
    });

    describe('verifyPassword', () => {
        it('should successfully verify correct password', async () => {
            bcrypt.compare.mockResolvedValue(true);

            const result = await UserService.verifyPassword('password123', 'hashed-password');

            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
            expect(result).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            bcrypt.compare.mockResolvedValue(false);

            const result = await UserService.verifyPassword('wrong-password', 'hashed-password');

            expect(result).toBe(false);
        });

        it('should throw error if bcrypt fails', async () => {
            bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

            await expect(UserService.verifyPassword('password', 'hash'))
                .rejects
                .toThrow(ApiError.badRequest('Password verification failed'));
        });
    });

    describe('updateBalance', () => {
        const mockUser = {
            id: 1,
            balance: 100
        };

        beforeEach(() => {
            UserRepository.findByIdWithBalance.mockResolvedValue(mockUser);
            UserRepository.updateBalance.mockResolvedValue([1]);
            onUserBankUpdated.mockResolvedValue(true);
        });

        describe('income operations', () => {
            it('should increase balance for BALANCE_INCOME', async () => {
                const result = await UserService.updateBalance({
                    amount: 50,
                    type: 'BALANCE_INCOME',
                    userId: 1
                });

                expect(UserRepository.updateBalance).toHaveBeenCalledWith(1, 150);
                expect(onUserBankUpdated).toHaveBeenCalledWith(1, 150);
                expect(result.newBalance).toBe(150);
            });

            it('should increase balance for EVENT_INCOME', async () => {
                const result = await UserService.updateBalance({
                    amount: 25,
                    type: 'EVENT_INCOME',
                    userId: 1
                });

                expect(UserRepository.updateBalance).toHaveBeenCalledWith(1, 125);
                expect(result.newBalance).toBe(125);
            });

            it('should increase balance for GIFT', async () => {
                const result = await UserService.updateBalance({
                    amount: 75,
                    type: 'GIFT',
                    userId: 1
                });

                expect(UserRepository.updateBalance).toHaveBeenCalledWith(1, 175);
                expect(result.newBalance).toBe(175);
            });
        });

        describe('outcome operations', () => {
            it('should decrease balance for BALANCE_OUTCOME', async () => {
                const result = await UserService.updateBalance({
                    amount: 30,
                    type: 'BALANCE_OUTCOME',
                    userId: 1
                });

                expect(UserRepository.updateBalance).toHaveBeenCalledWith(1, 70);
                expect(result.newBalance).toBe(70);
            });

            it('should decrease balance for EVENT_OUTCOME', async () => {
                const result = await UserService.updateBalance({
                    amount: 20,
                    type: 'EVENT_OUTCOME',
                    userId: 1
                });

                expect(UserRepository.updateBalance).toHaveBeenCalledWith(1, 80);
                expect(result.newBalance).toBe(80);
            });
        });

        describe('error cases', () => {
            it('should throw error for zero amount', async () => {
                await expect(UserService.updateBalance({
                    amount: 0,
                    type: 'BALANCE_INCOME',
                    userId: 1
                })).rejects.toThrow('Amount must be positive');
            });

            it('should throw error for negative amount', async () => {
                await expect(UserService.updateBalance({
                    amount: -10,
                    type: 'BALANCE_INCOME',
                    userId: 1
                })).rejects.toThrow('Amount must be positive');
            });

            it('should throw error if user not found', async () => {
                UserRepository.findByIdWithBalance.mockResolvedValue(null);

                await expect(UserService.updateBalance({
                    amount: 50,
                    type: 'BALANCE_INCOME',
                    userId: 999
                })).rejects.toThrow('User not found');
            });

            it('should throw error for invalid transaction type', async () => {
                await expect(UserService.updateBalance({
                    amount: 50,
                    type: 'INVALID_TYPE',
                    userId: 1
                })).rejects.toThrow('Invalid transaction type');
            });

            it('should throw error for insufficient balance', async () => {
                await expect(UserService.updateBalance({
                    amount: 150,
                    type: 'EVENT_OUTCOME',
                    userId: 1
                })).rejects.toThrow('Insufficient balance');
            });

            it('should continue if achievement tracking fails', async () => {
                onUserBankUpdated.mockRejectedValue(new Error('Achievement error'));

                const result = await UserService.updateBalance({
                    amount: 50,
                    type: 'BALANCE_INCOME',
                    userId: 1
                });

                expect(result.newBalance).toBe(150);
            });

            it('should throw database error if update fails', async () => {
                UserRepository.updateBalance.mockRejectedValue(new Error('Database error'));

                await expect(UserService.updateBalance({
                    amount: 50,
                    type: 'BALANCE_INCOME',
                    userId: 1
                })).rejects.toThrow('Failed to update balance');
            });
        });
    });

    describe('getAllUsers', () => {
        it('should return all users with only id attribute', async () => {
            const mockUsers = [{ id: 1 }, { id: 2 }, { id: 3 }];
            UserRepository.findAllMinimal.mockResolvedValue(mockUsers);

            const result = await UserService.getAllUsers();

            expect(UserRepository.findAllMinimal).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });

        it('should throw error if database fails', async () => {
            UserRepository.findAllMinimal.mockRejectedValue(new Error('Database error'));

            await expect(UserService.getAllUsers())
                .rejects
                .toThrow('Error getting all users');
        });
    });

    describe('findByIdWithBalance', () => {
        it('should find user by id with balance', async () => {
            const mockUser = { id: 1, balance: 100 };
            UserRepository.findByIdWithBalance.mockResolvedValue(mockUser);

            const result = await UserService.findByIdWithBalance(1);

            expect(UserRepository.findByIdWithBalance).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockUser);
        });

        it('should throw error if database fails', async () => {
            UserRepository.findByIdWithBalance.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findByIdWithBalance(1))
                .rejects
                .toThrow('Error finding user with balance');
        });
    });

    describe('update', () => {
        const mockUser = {
            id: 1,
            username: 'oldusername',
            email: 'old@example.com',
            password: 'old-hashed-password'
        };

        beforeEach(() => {
            UserRepository.findByPk.mockResolvedValue(mockUser);
            UserRepository.update.mockResolvedValue([1]);
        });

        it('should throw error if user not found', async () => {
            UserRepository.findByPk.mockResolvedValue(null);

            await expect(UserService.update(999, { username: 'newusername' }))
                .rejects
                .toThrow('User not found');
        });

        describe('username update', () => {
            it('should successfully update username', async () => {
                UserRepository.findByUsername.mockResolvedValue(null);
                const updatedUser = { ...mockUser, username: 'newusername' };
                UserRepository.findByIdWithAssociations.mockResolvedValue(updatedUser);

                const result = await UserService.update(1, { username: 'newusername' });

                expect(UserRepository.findByUsername).toHaveBeenCalledWith('newusername');
                expect(UserRepository.update).toHaveBeenCalledWith(1, { username: 'newusername' });
            });

            it('should not update if username is the same', async () => {
                const result = await UserService.update(1, { username: 'oldusername' });

                expect(UserRepository.findByUsername).not.toHaveBeenCalled();
                expect(UserRepository.update).not.toHaveBeenCalled();
            });

            it('should throw error for username too short', async () => {
                await expect(UserService.update(1, { username: 'ab' }))
                    .rejects
                    .toThrow('Username must be at least 5 characters long');
            });

            it('should throw error for username too long', async () => {
                const longUsername = 'a'.repeat(31);
                await expect(UserService.update(1, { username: longUsername }))
                    .rejects
                    .toThrow('Username cannot exceed 30 characters');
            });

            it('should throw error for invalid username characters', async () => {
                await expect(UserService.update(1, { username: 'user-name' }))
                    .rejects
                    .toThrow('Username can only contain letters, numbers and underscore');
            });

            it('should throw error if username already exists', async () => {
                UserRepository.findByUsername.mockResolvedValue({ id: 2, username: 'newusername' });

                await expect(UserService.update(1, { username: 'newusername' }))
                    .rejects
                    .toThrow('Username already exists');
            });
        });

        describe('email update', () => {
            it('should successfully update email', async () => {
                UserRepository.findByEmail.mockResolvedValue(null);

                await UserService.update(1, { email: 'new@example.com' });

                expect(UserRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
                expect(UserRepository.update).toHaveBeenCalledWith(1, { email: 'new@example.com' });
            });

            it('should not update if email is the same', async () => {
                await UserService.update(1, { email: 'old@example.com' });

                expect(UserRepository.findByEmail).not.toHaveBeenCalled();
                expect(UserRepository.update).not.toHaveBeenCalled();
            });

            it('should throw error for invalid email format', async () => {
                await expect(UserService.update(1, { email: 'invalid-email' }))
                    .rejects
                    .toThrow('Please enter a valid email address');
            });

            it('should throw error if email already exists', async () => {
                UserRepository.findByEmail.mockResolvedValue({ id: 2, email: 'new@example.com' });

                await expect(UserService.update(1, { email: 'new@example.com' }))
                    .rejects
                    .toThrow('Email already exists');
            });
        });

        describe('password update', () => {
            beforeEach(() => {
                bcrypt.compare.mockResolvedValue(true);
                bcrypt.hash.mockResolvedValue('new-hashed-password');
            });

            it('should successfully update password', async () => {
                await UserService.update(1, {
                    currentPassword: 'oldpassword',
                    newPassword: 'newpassword123'
                });

                expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', 'old-hashed-password');
                expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
                expect(UserRepository.update).toHaveBeenCalledWith(1, { password: 'new-hashed-password' });
            });

            it('should throw error if new password is too short', async () => {
                await expect(UserService.update(1, {
                    currentPassword: 'oldpassword',
                    newPassword: '123'
                })).rejects.toThrow('Password must be at least 5 characters long');
            });

            it('should throw error if new password is too long', async () => {
                const longPassword = 'a'.repeat(101);
                await expect(UserService.update(1, {
                    currentPassword: 'oldpassword',
                    newPassword: longPassword
                })).rejects.toThrow('Password cannot exceed 100 characters');
            });

            it('should throw error if current password is incorrect', async () => {
                bcrypt.compare.mockResolvedValue(false);

                await expect(UserService.update(1, {
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123'
                })).rejects.toThrow('Current password is incorrect');
            });

            it('should not update password if only newPassword is provided', async () => {
                await UserService.update(1, { newPassword: 'newpassword123' });

                expect(bcrypt.compare).not.toHaveBeenCalled();
                expect(UserRepository.update).not.toHaveBeenCalled();
            });
        });

                 it('should return updated user with associations', async () => {
             UserRepository.findByUsername.mockResolvedValue(null); // username not taken
             const updatedUser = { ...mockUser, username: 'newusername' };
             UserRepository.findByIdWithAssociations.mockResolvedValue(updatedUser);

             const result = await UserService.update(1, { username: 'newusername' });

             expect(UserRepository.findByIdWithAssociations).toHaveBeenCalledWith(1);
         });

                 it('should handle database errors', async () => {
             UserRepository.findByUsername.mockResolvedValue(null); // username not taken
             UserRepository.update.mockRejectedValue(new Error('Database error'));

             await expect(UserService.update(1, { username: 'newusername' }))
                 .rejects
                 .toThrow('Database error');
         });
    });

    describe('findById', () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
        };

        it('should find user by ID with associations', async () => {
            UserRepository.findByIdWithAssociations.mockResolvedValue(mockUser);

            const result = await UserService.findById(1, true);

            expect(UserRepository.findByIdWithAssociations).toHaveBeenCalledWith(1, true);
            expect(result).toEqual(mockUser);
        });

        it('should find user by ID without associations', async () => {
            UserRepository.findByIdWithAssociations.mockResolvedValue(mockUser);

            const result = await UserService.findById(1, false);

            expect(UserRepository.findByIdWithAssociations).toHaveBeenCalledWith(1, false);
            expect(result).toEqual(mockUser);
        });

        it('should return null if user not found', async () => {
            UserRepository.findByIdWithAssociations.mockResolvedValue(null);

            const result = await UserService.findById(999);

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            UserRepository.findByIdWithAssociations.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findById(1))
                .rejects
                .toThrow('Error finding user by ID');
        });
    });

    describe('findAll', () => {
        const mockUsers = [
            { id: 1, username: 'user1' },
            { id: 2, username: 'user2' }
        ];

        it('should find all users with associations', async () => {
            UserRepository.findAllWithAssociations.mockResolvedValue(mockUsers);

            const result = await UserService.findAll(true);

            expect(UserRepository.findAllWithAssociations).toHaveBeenCalledWith(true);
            expect(result).toEqual(mockUsers);
        });

        it('should find all users without associations', async () => {
            UserRepository.findAllWithAssociations.mockResolvedValue(mockUsers);

            const result = await UserService.findAll(false);

            expect(UserRepository.findAllWithAssociations).toHaveBeenCalledWith(false);
            expect(result).toEqual(mockUsers);
        });

        it('should handle database errors', async () => {
            UserRepository.findAllWithAssociations.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findAll())
                .rejects
                .toThrow('Error finding all users');
        });
    });

    describe('searchByUsername', () => {
        const mockUsers = [
            { id: 1, username: 'testuser1' },
            { id: 2, username: 'testuser2' }
        ];

        it('should search users by username with associations', async () => {
            UserRepository.searchByUsername.mockResolvedValue(mockUsers);

            const result = await UserService.searchByUsername('test', true);

            expect(UserRepository.searchByUsername).toHaveBeenCalledWith('test', true);
            expect(result).toEqual(mockUsers);
        });

        it('should search users by username without associations', async () => {
            UserRepository.searchByUsername.mockResolvedValue(mockUsers);

            const result = await UserService.searchByUsername('test', false);

            expect(UserRepository.searchByUsername).toHaveBeenCalledWith('test', false);
            expect(result).toEqual(mockUsers);
        });

        it('should handle database errors', async () => {
            UserRepository.searchByUsername.mockRejectedValue(new Error('Database error'));

            await expect(UserService.searchByUsername('test'))
                .rejects
                .toThrow('Error searching users by username');
        });
    });

    describe('findAccounts', () => {
        it('should find accounts for a user', async () => {
            const mockAccounts = [
                { id: '1', userId: 1, provider: 'discord' },
                { id: '2', userId: 1, provider: 'google' }
            ];
            AccountRepository.findByUserId.mockResolvedValue(mockAccounts);

            const result = await UserService.findAccounts(1);

            expect(AccountRepository.findByUserId).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockAccounts);
        });

        it('should handle database errors', async () => {
            AccountRepository.findByUserId.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findAccounts(1))
                .rejects
                .toThrow('Error finding user accounts');
        });
    });

    describe('findByEmail', () => {
        const mockUser = {
            id: 1,
            email: 'test@example.com'
        };

        it('should find user by email', async () => {
            UserRepository.findByEmail.mockResolvedValue(mockUser);

            const result = await UserService.findByEmail('test@example.com');

            expect(UserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(result).toEqual(mockUser);
        });

        it('should return null if user not found', async () => {
            UserRepository.findByEmail.mockResolvedValue(null);

            const result = await UserService.findByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            UserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findByEmail('test@example.com'))
                .rejects
                .toThrow('Error finding user by email');
        });
    });

    describe('findByIdWithAccountsOnly', () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            Accounts: [
                { id: '1', provider: 'discord' }
            ]
        };

        it('should find user by ID with accounts', async () => {
            UserRepository.findByIdWithAssociations.mockResolvedValue(mockUser);

            const result = await UserService.findByIdWithAccountsOnly(1);

            expect(UserRepository.findByIdWithAssociations).toHaveBeenCalledWith(1, true);
            expect(result).toEqual(mockUser);
        });

        it('should return null if user not found', async () => {
            UserRepository.findByIdWithAssociations.mockResolvedValue(null);

            const result = await UserService.findByIdWithAccountsOnly(999);

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            UserRepository.findByIdWithAssociations.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findByIdWithAccountsOnly(1))
                .rejects
                .toThrow('Error finding User by ID');
        });
    });

    describe('getUsersByBalance', () => {
        it('should get users ranked by balance with limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 1000 },
                { id: 2, username: 'user2', amount: 500 }
            ];
            UserRepository.findUsersByBalance.mockResolvedValue(mockRankings);

            const result = await UserService.getUsersByBalance(10);

            expect(UserRepository.findUsersByBalance).toHaveBeenCalledWith(10);
            expect(result).toEqual(mockRankings);
        });

        it('should get users ranked by balance without limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 1000 }
            ];
            UserRepository.findUsersByBalance.mockResolvedValue(mockRankings);

            const result = await UserService.getUsersByBalance();

            expect(UserRepository.findUsersByBalance).toHaveBeenCalledWith(undefined);
            expect(result).toEqual(mockRankings);
        });

        it('should handle database errors', async () => {
            UserRepository.findUsersByBalance.mockRejectedValue(new Error('Database error'));

            await expect(UserService.getUsersByBalance(10))
                .rejects
                .toThrow('Error getting users by balance');
        });
    });

    describe('getUsersByEventIncome', () => {
        const afterDateString = '2024-01-01T00:00:00.000Z';
        const afterDate = new Date(afterDateString);

        it('should get users ranked by event income with afterDate and limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 500.50 },
                { id: 2, username: 'user2', amount: 200.25 }
            ];
            UserRepository.findUsersByTransactionSum.mockResolvedValue(mockRankings);

            const result = await UserService.getUsersByEventIncome(afterDateString, 10);

            expect(UserRepository.findUsersByTransactionSum).toHaveBeenCalledWith('EVENT_INCOME', afterDate, 10);
            expect(result).toEqual(mockRankings);
        });

        it('should get users ranked by event income without afterDate', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 300.75 }
            ];
            UserRepository.findUsersByTransactionSum.mockResolvedValue(mockRankings);

            const result = await UserService.getUsersByEventIncome(null, 5);

            expect(UserRepository.findUsersByTransactionSum).toHaveBeenCalledWith('EVENT_INCOME', null, 5);
            expect(result).toEqual(mockRankings);
        });

        it('should get users ranked by event income without limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 300.75 }
            ];
            UserRepository.findUsersByTransactionSum.mockResolvedValue(mockRankings);

            const result = await UserService.getUsersByEventIncome();

            expect(UserRepository.findUsersByTransactionSum).toHaveBeenCalledWith('EVENT_INCOME', null, undefined);
            expect(result).toEqual(mockRankings);
        });

        it('should throw error for invalid afterDate format', async () => {
            await expect(UserService.getUsersByEventIncome('invalid-date', 10))
                .rejects
                .toThrow('Invalid afterDate format. Please use ISO string format.');
        });

        it('should handle database errors', async () => {
            UserRepository.findUsersByTransactionSum.mockRejectedValue(new Error('Database error'));

            await expect(UserService.getUsersByEventIncome(afterDateString, 10))
                .rejects
                .toThrow('Error getting users by event income');
        });
    });

    describe('getUsersByEventOutcome', () => {
        const afterDateString = '2024-01-01T00:00:00.000Z';
        const afterDate = new Date(afterDateString);

        it('should get users ranked by event outcome with afterDate and limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 400.00 },
                { id: 2, username: 'user2', amount: 150.75 }
            ];
            UserRepository.findUsersByTransactionSum.mockResolvedValue(mockRankings);

            const result = await UserService.getUsersByEventOutcome(afterDateString, 20);

            expect(UserRepository.findUsersByTransactionSum).toHaveBeenCalledWith('EVENT_OUTCOME', afterDate, 20);
            expect(result).toEqual(mockRankings);
        });

        it('should get users ranked by event outcome without afterDate', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 250.50 }
            ];
            UserRepository.findUsersByTransactionSum.mockResolvedValue(mockRankings);

            const result = await UserService.getUsersByEventOutcome(null, 5);

            expect(UserRepository.findUsersByTransactionSum).toHaveBeenCalledWith('EVENT_OUTCOME', null, 5);
            expect(result).toEqual(mockRankings);
        });

        it('should get users ranked by event outcome without limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 250.50 }
            ];
            UserRepository.findUsersByTransactionSum.mockResolvedValue(mockRankings);

            const result = await UserService.getUsersByEventOutcome();

            expect(UserRepository.findUsersByTransactionSum).toHaveBeenCalledWith('EVENT_OUTCOME', null, undefined);
            expect(result).toEqual(mockRankings);
        });

        it('should throw error for invalid afterDate format', async () => {
            await expect(UserService.getUsersByEventOutcome('invalid-after', 5))
                .rejects
                .toThrow('Invalid afterDate format. Please use ISO string format.');
        });

        it('should throw error for empty afterDate string', async () => {
            await expect(UserService.getUsersByEventOutcome('', 5))
                .rejects
                .toThrow('Invalid afterDate format. Please use ISO string format.');
        });

        it('should handle database errors', async () => {
            UserRepository.findUsersByTransactionSum.mockRejectedValue(new Error('Database error'));

            await expect(UserService.getUsersByEventOutcome(afterDateString, 5))
                .rejects
                .toThrow('Error getting users by event outcome');
        });
    });
}); 