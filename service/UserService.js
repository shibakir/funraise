const { User } = require('../model');
const ApiError = require('../exception/ApiError');
const createUserSchema = require("../validation/schema/UserSchema");
const { initializeUser, onUserBankUpdated } = require('../utils/achievement');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mailService = require('../utils/mail/mailService');
const { AUTH_CONFIG, VALIDATION_LIMITS } = require('../constants');

class UserService {

    async create(data) {
        
        const { error } = createUserSchema.validate(data);
        if (error) {
            throw ApiError.validation('Validation failed', error.details.map(d => d.message));
        }

        try {
            // Check if user already exists
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: data.email },
                        { username: data.username }
                    ]
                }
            });

            if (existingUser) {
                const conflictDetails = [];
                if (existingUser.email === data.email) {
                    conflictDetails.push('Email already exists');
                }
                if (existingUser.username === data.username) {
                    conflictDetails.push('Username already exists');
                }
                throw ApiError.conflict('User with this credentials already exists', conflictDetails);
            }

            // Hash password before saving
            const hashedPassword = await bcrypt.hash(data.password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

            // Generate activation link
            const activationLink = crypto.randomBytes(32).toString('hex');

            const user = await User.create({
                username: data.username,
                password: hashedPassword,
                email: data.email,
                activationLink: activationLink,
                isActivated: false,
                ...(data.image && { image: data.image }),
            });

            // Send activation email
            try {
                const activationUrl = `${process.env.FUNRAISE_APP_URL}/activate/${activationLink}`;
                await mailService.sendActivationMail(data.email, activationUrl);
                //console.log('Activation email sent successfully to:', data.email);
                
            } catch (emailError) {
                //console.error('Failed to send activation email:', emailError);
                // Don't fail registration if email fails to send
            }

            // Initialize achievements for a new user
            try {
                await initializeUser(user.id);
            } catch (achievementError) {
                //console.error('Failed to initialize user achievements:', achievementError);
                // Don't fail if achievements initialization fails
            }

            return user;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error creating user', e);
        }
    }

    async activate(activationLink) {
        try {
            if (!activationLink) {
                throw ApiError.badRequest('Activation link is required');
            }

            // Find user by activation link
            const user = await User.findOne({
                where: { activationLink: activationLink }
            });

            if (!user) {
                throw ApiError.badRequest('Invalid activation link');
            }

            if (user.isActivated) {
                throw ApiError.badRequest('User is already activated');
            }

            // Activate user and clear activation link
            await User.update(
                { 
                    isActivated: true, 
                    activationLink: null 
                },
                { where: { id: user.id } }
            );

            return await User.findByPk(user.id, {
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error activating user', e);
        }
    }

    async resendActivationEmail(email) {
        try {
            if (!email) {
                throw ApiError.badRequest('Email is required');
            }

            // Find user by email
            const user = await User.findOne({
                where: { email: email }
            });

            if (!user) {
                throw ApiError.notFound('User with this email not found');
            }

            if (user.isActivated) {
                throw ApiError.badRequest('User is already activated');
            }

            if (!user.activationLink) {
                // Generate new activation link if it doesn't exist
                const activationLink = crypto.randomBytes(32).toString('hex');
                await User.update(
                    { activationLink: activationLink },
                    { where: { id: user.id } }
                );
                user.activationLink = activationLink;
            }

            // Send activation email
            try {
                const activationUrl = `${process.env.CLIENT_URL}/activate/${user.activationLink}`;
                await mailService.sendActivationMail(email, activationUrl);
                //console.log('Activation email resent successfully to:', email);
                
                // Log activation link in development mode for testing
                if (process.env.NODE_ENV === 'development') {
                    //console.log('Resent activation link for testing:', activationUrl);
                }
                
                return true;
            } catch (emailError) {
                //console.error('Failed to resend activation email:', emailError);
                
                // In development, still log the activation link even if email fails
                if (process.env.NODE_ENV === 'development') {
                    const activationUrl = `${process.env.CLIENT_URL}/activate/${user.activationLink}`;
                    //console.log('Resent activation link for testing (email failed):', activationUrl);
                }
                
                throw ApiError.internal('Failed to send activation email');
            }
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error resending activation email', e);
        }
    }

    async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (e) {
            throw ApiError.badRequest('Password verification failed');
        }
    }

    async updateBalance(data) {
        try {
            const { amount, type, userId } = data;

            // validation of input data
            if (amount <= 0) {
                throw ApiError.businessLogic('Amount must be positive', ['Amount cannot be zero or negative']);
            }

            const user = await User.findOne({
                where: { id: userId },
                attributes: ['balance'],
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            let addedAmountIsPositive = true;

            switch (type) {
                case 'BALANCE_INCOME':
                case 'EVENT_INCOME':
                case 'GIFT':
                    addedAmountIsPositive = true;
                    break;
                case 'BALANCE_OUTCOME':
                case 'EVENT_OUTCOME':
                    addedAmountIsPositive = false;
                    break;
                default:
                    throw ApiError.businessLogic('Invalid transaction type', [
                        'Valid types are: BALANCE_INCOME, EVENT_INCOME, GIFT, BALANCE_OUTCOME, EVENT_OUTCOME'
                    ]);
            }

            const currentBalance = user.balance;
            const newBalance = addedAmountIsPositive 
                ? currentBalance + amount 
                : currentBalance - amount;

            if (newBalance < 0) {
                throw ApiError.businessLogic('Insufficient balance', [
                    `Current balance: ${currentBalance}`,
                    `Required amount: ${amount}`,
                    `Shortfall: ${Math.abs(newBalance)}`
                ]);
            }

            await User.update(
                { balance: newBalance },
                { where: { id: userId } }
            );

            // Track user bank updates for achievements
            try {
                await onUserBankUpdated(userId, newBalance);
            } catch (achievementError) {
                //console.error('Failed to update achievement tracking:', achievementError);
                // don't fail if achievement tracking update fails
            }

            return { newBalance };
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Failed to update balance', e);
        }
    }

    async getAllUsers() {
        try {
            return await User.findAll({ 
                attributes: ['id'] 
            });
        } catch (e) {
            throw ApiError.badRequest('Error getting all users', e.message);
        }
    }

    async findByIdWithBalance(userId) {
        try {
            return await User.findByPk(userId, { 
                attributes: ['id', 'balance'] 
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding user with balance', e.message);
        }
    }

    async update(id, data) {
        try {
            const user = await User.findByPk(id);
            if (!user) {
                throw ApiError.badRequest('User not found');
            }

            const updateData = {};

            // update username
            if (data.username && data.username !== user.username) {
                // Validate username
                if (data.username.length < VALIDATION_LIMITS.USERNAME_MIN_LENGTH) {
                    throw ApiError.badRequest(`Username must be at least ${VALIDATION_LIMITS.USERNAME_MIN_LENGTH} characters long`);
                }
                if (data.username.length > VALIDATION_LIMITS.USERNAME_MAX_LENGTH) {
                    throw ApiError.badRequest(`Username cannot exceed ${VALIDATION_LIMITS.USERNAME_MAX_LENGTH} characters`);
                }
                if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
                    throw ApiError.badRequest('Username can only contain letters, numbers and underscore');
                }

                // check if username is already taken
                const existingUser = await User.findOne({
                    where: { 
                        username: data.username,
                        id: { [Op.ne]: id } 
                    }
                });
                if (existingUser) {
                    throw ApiError.badRequest('Username already exists');
                }
                updateData.username = data.username;
            }

            // update email
            if (data.email && data.email !== user.email) {
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    throw ApiError.badRequest('Please enter a valid email address');
                }

                // check if email is already taken
                const existingUser = await User.findOne({
                    where: { 
                        email: data.email,
                        id: { [Op.ne]: id } 
                    }
                });
                if (existingUser) {
                    throw ApiError.badRequest('Email already exists');
                }
                updateData.email = data.email;
            }

            // update password
            if (data.newPassword && data.currentPassword) {
                // Validate new password
                if (data.newPassword.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
                    throw ApiError.badRequest(`Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} characters long`);
                }
                if (data.newPassword.length > VALIDATION_LIMITS.PASSWORD_MAX_LENGTH) {
                    throw ApiError.badRequest(`Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX_LENGTH} characters`);
                }

                // check current password with bcrypt
                const isCurrentPasswordValid = await this.verifyPassword(data.currentPassword, user.password);
                if (!isCurrentPasswordValid) {
                    throw ApiError.badRequest('Current password is incorrect');
                }
                
                // Hash new password before saving
                updateData.password = await bcrypt.hash(data.newPassword, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);
            }

            // update user
            if (Object.keys(updateData).length > 0) {
                await User.update(updateData, { where: { id } });
            }

            // return updated user
            return await User.findByPk(id, {
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' }
                ]
            });
        } catch (e) {
            throw ApiError.badRequest(e.message || 'Failed to update user');
        }
    }

    async findById(userId, includeAssociations = true) {
        try {
            const includeOptions = includeAssociations ? [
                { association: 'createdEvents' },
                { association: 'receivedEvents' },
                { model: require('../model').Account }
            ] : [];

            const user = await User.findByPk(userId, {
                include: includeOptions
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            return user;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding user by ID', e);
        }
    }

    async findAll(includeAssociations = true) {
        try {
            const includeOptions = includeAssociations ? [
                { association: 'createdEvents' },
                { association: 'receivedEvents' }
            ] : [];

            return await User.findAll({
                include: includeOptions
            });
        } catch (e) {
            throw ApiError.database('Error finding all users', e);
        }
    }

    async searchByUsername(username, includeAssociations = true) {
        try {
            const includeOptions = includeAssociations ? [
                { association: 'createdEvents' },
                { association: 'receivedEvents' }
            ] : [];

            return await User.findAll({
                where: {
                    username: {
                        [Op.like]: `%${username}%`
                    }
                },
                include: includeOptions
            });
        } catch (e) {
            throw ApiError.database('Error searching users by username', e);
        }
    }

    async findAccounts(userId) {
        try {
            const { Account } = require('../model');
            return await Account.findAll({
                where: { userId: userId }
            });
        } catch (e) {
            throw ApiError.database('Error finding user accounts', e);
        }
    }

    async findByEmail(email) {
        try {
            const user = await User.findOne({
                where: { email: email }
            });
            return user;
        } catch (e) {
            throw ApiError.database('Error finding user by email', e);
        }
    }

    async findByIdWithAccountsOnly(userId) {
        try {
            const { Account } = require('../model');
            const user = await User.findByPk(userId, {
                include: [
                    { association: 'createdEvents' },
                    { association: 'receivedEvents' },
                    { model: Account }
                ]
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            return user;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding user by ID with accounts', e);
        }
    }

}

module.exports = new UserService();