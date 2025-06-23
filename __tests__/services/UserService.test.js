const UserService = require('../../service/UserService');
const { User, Account } = require('../../model');
const ApiError = require('../../exception/ApiError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mailService = require('../../utils/mail/mailService');
const { initializeUser, onUserBankUpdated } = require('../../utils/achievement');
const { Op } = require('sequelize');

// Mock dependencies
jest.mock('../../model');
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
            User.findOne.mockResolvedValue(null);
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
            User.create.mockResolvedValue(createdUser);
            mailService.sendActivationMail.mockResolvedValue(true);
            initializeUser.mockResolvedValue(true);

            const result = await UserService.create({
                ...validUserData,
                image: 'https://example.com/test-image.jpg'
            });

            expect(User.findOne).toHaveBeenCalledWith({
                where: {
                    [Op.or]: [
                        { email: validUserData.email },
                        { username: validUserData.username }
                    ]
                }
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 12);
            expect(User.create).toHaveBeenCalledWith({
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
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            const createdUser = {
                id: 1,
                ...validUserData,
                password: 'hashed-password'
            };
            User.create.mockResolvedValue(createdUser);
            mailService.sendActivationMail.mockResolvedValue(true);

            const result = await UserService.create(validUserData);

            expect(User.create).toHaveBeenCalledWith({
                username: validUserData.username,
                password: 'hashed-password',
                email: validUserData.email,
                activationLink: 'activation-link',
                isActivated: false
            });
            expect(result).toEqual(createdUser);
        });

        it('should continue if email sending fails', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            const createdUser = { id: 1, ...validUserData };
            User.create.mockResolvedValue(createdUser);
            mailService.sendActivationMail.mockRejectedValue(new Error('Email service down'));

            const result = await UserService.create(validUserData);

            expect(result).toEqual(createdUser);
        });

        it('should continue if achievement initialization fails', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            const createdUser = { id: 1, ...validUserData };
            User.create.mockResolvedValue(createdUser);
            mailService.sendActivationMail.mockResolvedValue(true);
            initializeUser.mockRejectedValue(new Error('Achievement service down'));

            const result = await UserService.create(validUserData);

            expect(result).toEqual(createdUser);
        });

        it('should throw ApiError.conflict if email already exists', async () => {
            User.findOne.mockResolvedValue({
                email: validUserData.email,
                username: 'different-username'
            });

            await expect(UserService.create(validUserData))
                .rejects
                .toThrow(ApiError.conflict('User with this credentials already exists', ['Email already exists']));
        });

        it('should throw ApiError.conflict if username already exists', async () => {
            User.findOne.mockResolvedValue({
                email: 'different@email.com',
                username: validUserData.username
            });

            await expect(UserService.create(validUserData))
                .rejects
                .toThrow(ApiError.conflict('User with this credentials already exists', ['Username already exists']));
        });

        it('should throw ApiError.conflict if both email and username exist', async () => {
            User.findOne.mockResolvedValue({
                email: validUserData.email,
                username: validUserData.username
            });

            await expect(UserService.create(validUserData))
                .rejects
                .toThrow(ApiError.conflict('User with this credentials already exists', ['Email already exists', 'Username already exists']));
        });

        it('should throw validation error for invalid data', async () => {
            const invalidData = {
                username: 'a', // too short
                email: 'invalid-email',
                password: '123' // too short
            };

            await expect(UserService.create(invalidData))
                .rejects
                .toThrow(ApiError.validation('Validation failed'));
        });

        it('should throw database error if User.create fails', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('activation-link')
            });
            User.create.mockRejectedValue(new Error('Database error'));

            await expect(UserService.create(validUserData))
                .rejects
                .toThrow(ApiError.database('Error creating user'));
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

            User.findOne.mockResolvedValue(mockUser);
            User.update.mockResolvedValue([1]);
            User.findByPk.mockResolvedValue(activatedUser);

            const result = await UserService.activate('valid-link');

            expect(User.findOne).toHaveBeenCalledWith({
                where: { activationLink: 'valid-link' }
            });
            expect(User.update).toHaveBeenCalledWith(
                { isActivated: true, activationLink: null },
                { where: { id: 1 } }
            );
            expect(User.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
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
            User.findOne.mockResolvedValue(null);

            await expect(UserService.activate('invalid-link'))
                .rejects
                .toThrow(ApiError.badRequest('Invalid activation link'));
        });

        it('should throw error if user is already activated', async () => {
            User.findOne.mockResolvedValue({
                id: 1,
                isActivated: true
            });

            await expect(UserService.activate('valid-link'))
                .rejects
                .toThrow(ApiError.badRequest('User is already activated'));
        });

        it('should throw database error if activation fails', async () => {
            User.findOne.mockResolvedValue({
                id: 1,
                isActivated: false
            });
            User.update.mockRejectedValue(new Error('Database error'));

            await expect(UserService.activate('valid-link'))
                .rejects
                .toThrow(ApiError.database('Error activating user'));
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
            User.findOne.mockResolvedValue(mockUser);
            mailService.sendActivationMail.mockResolvedValue(true);

            const result = await UserService.resendActivationEmail(testEmail);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: testEmail }
            });
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
            User.findOne.mockResolvedValue(mockUser);
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue('new-activation-link')
            });
            User.update.mockResolvedValue([1]);
            mailService.sendActivationMail.mockResolvedValue(true);

            const result = await UserService.resendActivationEmail(testEmail);

            expect(crypto.randomBytes).toHaveBeenCalledWith(32);
            expect(User.update).toHaveBeenCalledWith(
                { activationLink: 'new-activation-link' },
                { where: { id: 1 } }
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
            User.findOne.mockResolvedValue(null);

            await expect(UserService.resendActivationEmail(testEmail))
                .rejects
                .toThrow(ApiError.notFound('User with this email not found'));
        });

        it('should throw error if user is already activated', async () => {
            User.findOne.mockResolvedValue({
                id: 1,
                email: testEmail,
                isActivated: true
            });

            await expect(UserService.resendActivationEmail(testEmail))
                .rejects
                .toThrow(ApiError.badRequest('User is already activated'));
        });

        it('should throw error if email sending fails', async () => {
            const mockUser = {
                id: 1,
                email: testEmail,
                isActivated: false,
                activationLink: 'test-link'
            };
            User.findOne.mockResolvedValue(mockUser);
            mailService.sendActivationMail.mockRejectedValue(new Error('Email service down'));

                         await expect(UserService.resendActivationEmail(testEmail))
                 .rejects
                 .toThrow(ApiError.internal('Failed to send activation email'));
        });

        it('should handle database error gracefully', async () => {
            User.findOne.mockRejectedValue(new Error('Database error'));

            await expect(UserService.resendActivationEmail(testEmail))
                .rejects
                .toThrow(ApiError.database('Error resending activation email'));
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
            User.findOne.mockResolvedValue(mockUser);
            User.update.mockResolvedValue([1]);
            onUserBankUpdated.mockResolvedValue(true);
        });

        describe('income operations', () => {
            it('should increase balance for BALANCE_INCOME', async () => {
                const result = await UserService.updateBalance({
                    amount: 50,
                    type: 'BALANCE_INCOME',
                    userId: 1
                });

                expect(User.update).toHaveBeenCalledWith(
                    { balance: 150 },
                    { where: { id: 1 } }
                );
                expect(onUserBankUpdated).toHaveBeenCalledWith(1, 150);
                expect(result.newBalance).toBe(150);
            });

            it('should increase balance for EVENT_INCOME', async () => {
                const result = await UserService.updateBalance({
                    amount: 25,
                    type: 'EVENT_INCOME',
                    userId: 1
                });

                expect(User.update).toHaveBeenCalledWith(
                    { balance: 125 },
                    { where: { id: 1 } }
                );
                expect(result.newBalance).toBe(125);
            });

            it('should increase balance for GIFT', async () => {
                const result = await UserService.updateBalance({
                    amount: 75,
                    type: 'GIFT',
                    userId: 1
                });

                expect(User.update).toHaveBeenCalledWith(
                    { balance: 175 },
                    { where: { id: 1 } }
                );
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

                expect(User.update).toHaveBeenCalledWith(
                    { balance: 70 },
                    { where: { id: 1 } }
                );
                expect(result.newBalance).toBe(70);
            });

            it('should decrease balance for EVENT_OUTCOME', async () => {
                const result = await UserService.updateBalance({
                    amount: 20,
                    type: 'EVENT_OUTCOME',
                    userId: 1
                });

                expect(User.update).toHaveBeenCalledWith(
                    { balance: 80 },
                    { where: { id: 1 } }
                );
                expect(result.newBalance).toBe(80);
            });
        });

        describe('error cases', () => {
            it('should throw error for zero amount', async () => {
                await expect(UserService.updateBalance({
                    amount: 0,
                    type: 'BALANCE_INCOME',
                    userId: 1
                })).rejects.toThrow(ApiError.businessLogic('Amount must be positive', ['Amount cannot be zero or negative']));
            });

            it('should throw error for negative amount', async () => {
                await expect(UserService.updateBalance({
                    amount: -10,
                    type: 'BALANCE_INCOME',
                    userId: 1
                })).rejects.toThrow(ApiError.businessLogic('Amount must be positive'));
            });

            it('should throw error if user not found', async () => {
                User.findOne.mockResolvedValue(null);

                await expect(UserService.updateBalance({
                    amount: 50,
                    type: 'BALANCE_INCOME',
                    userId: 999
                })).rejects.toThrow(ApiError.notFound('User not found'));
            });

            it('should throw error for invalid transaction type', async () => {
                await expect(UserService.updateBalance({
                    amount: 50,
                    type: 'INVALID_TYPE',
                    userId: 1
                })).rejects.toThrow(ApiError.businessLogic('Invalid transaction type'));
            });

            it('should throw error for insufficient balance', async () => {
                await expect(UserService.updateBalance({
                    amount: 150,
                    type: 'EVENT_OUTCOME',
                    userId: 1
                })).rejects.toThrow(ApiError.businessLogic('Insufficient balance', [
                    'Current balance: 100',
                    'Required amount: 150',
                    'Shortfall: 50'
                ]));
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
                User.update.mockRejectedValue(new Error('Database error'));

                await expect(UserService.updateBalance({
                    amount: 50,
                    type: 'BALANCE_INCOME',
                    userId: 1
                })).rejects.toThrow(ApiError.database('Failed to update balance'));
            });
        });
    });

    describe('getAllUsers', () => {
        it('should return all users with only id attribute', async () => {
            const mockUsers = [{ id: 1 }, { id: 2 }, { id: 3 }];
            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserService.getAllUsers();

            expect(User.findAll).toHaveBeenCalledWith({
                attributes: ['id']
            });
            expect(result).toEqual(mockUsers);
        });

        it('should throw error if database fails', async () => {
            User.findAll.mockRejectedValue(new Error('Database error'));

            await expect(UserService.getAllUsers())
                .rejects
                .toThrow(ApiError.badRequest('Error getting all users'));
        });
    });

    describe('findByIdWithBalance', () => {
        it('should find user by id with balance', async () => {
            const mockUser = { id: 1, balance: 100 };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserService.findByIdWithBalance(1);

            expect(User.findByPk).toHaveBeenCalledWith(1, {
                attributes: ['id', 'balance']
            });
            expect(result).toEqual(mockUser);
        });

        it('should throw error if database fails', async () => {
            User.findByPk.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findByIdWithBalance(1))
                .rejects
                .toThrow(ApiError.badRequest('Error finding user with balance'));
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
            User.findByPk.mockResolvedValue(mockUser);
            User.update.mockResolvedValue([1]);
        });

        it('should throw error if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(UserService.update(999, { username: 'newusername' }))
                .rejects
                .toThrow(ApiError.badRequest('User not found'));
        });

        describe('username update', () => {
            it('should successfully update username', async () => {
                User.findOne.mockResolvedValue(null);
                const updatedUser = { ...mockUser, username: 'newusername' };
                User.findByPk.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(updatedUser);

                const result = await UserService.update(1, { username: 'newusername' });

                expect(User.findOne).toHaveBeenCalledWith({
                    where: {
                        username: 'newusername',
                        id: { [Op.ne]: 1 }
                    }
                });
                expect(User.update).toHaveBeenCalledWith(
                    { username: 'newusername' },
                    { where: { id: 1 } }
                );
            });

            it('should not update if username is the same', async () => {
                const result = await UserService.update(1, { username: 'oldusername' });

                expect(User.findOne).not.toHaveBeenCalled();
                expect(User.update).not.toHaveBeenCalled();
            });

            it('should throw error for username too short', async () => {
                await expect(UserService.update(1, { username: 'ab' }))
                    .rejects
                    .toThrow(ApiError.badRequest('Username must be at least 5 characters long'));
            });

            it('should throw error for username too long', async () => {
                const longUsername = 'a'.repeat(31);
                await expect(UserService.update(1, { username: longUsername }))
                    .rejects
                    .toThrow(ApiError.badRequest('Username cannot exceed 30 characters'));
            });

            it('should throw error for invalid username characters', async () => {
                await expect(UserService.update(1, { username: 'user-name' }))
                    .rejects
                    .toThrow(ApiError.badRequest('Username can only contain letters, numbers and underscore'));
            });

            it('should throw error if username already exists', async () => {
                User.findOne.mockResolvedValue({ id: 2, username: 'newusername' });

                await expect(UserService.update(1, { username: 'newusername' }))
                    .rejects
                    .toThrow(ApiError.badRequest('Username already exists'));
            });
        });

        describe('email update', () => {
            it('should successfully update email', async () => {
                User.findOne.mockResolvedValue(null);

                await UserService.update(1, { email: 'new@example.com' });

                expect(User.findOne).toHaveBeenCalledWith({
                    where: {
                        email: 'new@example.com',
                        id: { [Op.ne]: 1 }
                    }
                });
                expect(User.update).toHaveBeenCalledWith(
                    { email: 'new@example.com' },
                    { where: { id: 1 } }
                );
            });

            it('should not update if email is the same', async () => {
                await UserService.update(1, { email: 'old@example.com' });

                expect(User.findOne).not.toHaveBeenCalled();
                expect(User.update).not.toHaveBeenCalled();
            });

            it('should throw error for invalid email format', async () => {
                await expect(UserService.update(1, { email: 'invalid-email' }))
                    .rejects
                    .toThrow(ApiError.badRequest('Please enter a valid email address'));
            });

            it('should throw error if email already exists', async () => {
                User.findOne.mockResolvedValue({ id: 2, email: 'new@example.com' });

                await expect(UserService.update(1, { email: 'new@example.com' }))
                    .rejects
                    .toThrow(ApiError.badRequest('Email already exists'));
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
                expect(User.update).toHaveBeenCalledWith(
                    { password: 'new-hashed-password' },
                    { where: { id: 1 } }
                );
            });

            it('should throw error if new password is too short', async () => {
                await expect(UserService.update(1, {
                    currentPassword: 'oldpassword',
                    newPassword: '123'
                })).rejects.toThrow(ApiError.badRequest('Password must be at least 5 characters long'));
            });

            it('should throw error if new password is too long', async () => {
                const longPassword = 'a'.repeat(101);
                await expect(UserService.update(1, {
                    currentPassword: 'oldpassword',
                    newPassword: longPassword
                })).rejects.toThrow(ApiError.badRequest('Password cannot exceed 100 characters'));
            });

            it('should throw error if current password is incorrect', async () => {
                bcrypt.compare.mockResolvedValue(false);

                await expect(UserService.update(1, {
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123'
                })).rejects.toThrow(ApiError.badRequest('Current password is incorrect'));
            });

            it('should not update password if only newPassword is provided', async () => {
                await UserService.update(1, { newPassword: 'newpassword123' });

                expect(bcrypt.compare).not.toHaveBeenCalled();
                expect(User.update).not.toHaveBeenCalled();
            });
        });

                 it('should return updated user with associations', async () => {
             User.findOne.mockResolvedValue(null); // username not taken
             const updatedUser = { ...mockUser, username: 'newusername' };
             User.findByPk.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(updatedUser);

             const result = await UserService.update(1, { username: 'newusername' });

             expect(User.findByPk).toHaveBeenLastCalledWith(1, {
                 include: [
                     { association: 'createdEvents' },
                     { association: 'receivedEvents' }
                 ]
             });
         });

                 it('should handle database errors', async () => {
             User.findOne.mockResolvedValue(null); // username not taken
             User.update.mockRejectedValue(new Error('Database error'));

             await expect(UserService.update(1, { username: 'newusername' }))
                 .rejects
                 .toThrow(ApiError.badRequest('Database error'));
         });
    });

    describe('findById', () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
        };

        it('should find user by ID with associations', async () => {
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserService.findById(1, true);

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
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserService.findById(1, false);

            expect(User.findByPk).toHaveBeenCalledWith(1, {
                include: []
            });
            expect(result).toEqual(mockUser);
        });

        it('should throw error if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(UserService.findById(999))
                .rejects
                .toThrow(ApiError.notFound('User not found'));
        });

        it('should handle database errors', async () => {
            User.findByPk.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findById(1))
                .rejects
                .toThrow(ApiError.database('Error finding user by ID'));
        });
    });

    describe('findAll', () => {
        const mockUsers = [
            { id: 1, username: 'user1' },
            { id: 2, username: 'user2' }
        ];

        it('should find all users with associations', async () => {
            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserService.findAll(true);

            expect(User.findAll).toHaveBeenCalledWith({
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
            expect(result).toEqual(mockUsers);
        });

        it('should find all users without associations', async () => {
            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserService.findAll(false);

            expect(User.findAll).toHaveBeenCalledWith({
                include: []
            });
            expect(result).toEqual(mockUsers);
        });

        it('should handle database errors', async () => {
            User.findAll.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findAll())
                .rejects
                .toThrow(ApiError.database('Error finding all users'));
        });
    });

    describe('searchByUsername', () => {
        const mockUsers = [
            { id: 1, username: 'testuser1' },
            { id: 2, username: 'testuser2' }
        ];

        it('should search users by username with associations', async () => {
            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserService.searchByUsername('test', true);

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
            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserService.searchByUsername('test', false);

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

        it('should handle database errors', async () => {
            User.findAll.mockRejectedValue(new Error('Database error'));

            await expect(UserService.searchByUsername('test'))
                .rejects
                .toThrow(ApiError.database('Error searching users by username'));
        });
    });

    describe('findAccounts', () => {
        it('should find accounts for a user', async () => {
            const mockAccounts = [
                { id: '1', userId: 1, provider: 'discord' },
                { id: '2', userId: 1, provider: 'google' }
            ];
            Account.findAll.mockResolvedValue(mockAccounts);

            const result = await UserService.findAccounts(1);

            expect(Account.findAll).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
            expect(result).toEqual(mockAccounts);
        });

        it('should handle database errors', async () => {
            Account.findAll.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findAccounts(1))
                .rejects
                .toThrow(ApiError.database('Error finding user accounts'));
        });
    });

    describe('findByEmail', () => {
        const mockUser = {
            id: 1,
            email: 'test@example.com'
        };

        it('should find user by email', async () => {
            User.findOne.mockResolvedValue(mockUser);

            const result = await UserService.findByEmail('test@example.com');

            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
            expect(result).toEqual(mockUser);
        });

        it('should return null if user not found', async () => {
            User.findOne.mockResolvedValue(null);

            const result = await UserService.findByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            User.findOne.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findByEmail('test@example.com'))
                .rejects
                .toThrow(ApiError.database('Error finding user by email'));
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
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserService.findByIdWithAccountsOnly(1);

            expect(User.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' },
                    { model: Account }
                ]
            });
            expect(result).toEqual(mockUser);
        });

        it('should throw error if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(UserService.findByIdWithAccountsOnly(999))
                .rejects
                .toThrow(ApiError.notFound('User not found'));
        });

        it('should handle database errors', async () => {
            User.findByPk.mockRejectedValue(new Error('Database error'));

            await expect(UserService.findByIdWithAccountsOnly(1))
                .rejects
                .toThrow(ApiError.database('Error finding user by ID with accounts'));
        });
    });
}); 