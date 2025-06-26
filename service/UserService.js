const ApiError = require('../exception/ApiError');
const { initializeUser, onUserBankUpdated } = require('../utils/achievement');
const { UserRepository } = require('../repository');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mailService = require('../utils/mail/mailService');
const { AUTH_CONFIG, VALIDATION_LIMITS, TRANSACTION_TYPES } = require('../constants');

/**
 * Service layer for user management and authentication
 * Handles user registration, activation, authentication, profile management,
 * balance operations, and integration with achievement and email systems
 */
class UserService {

    /**
     * Creates a new user account with email verification and achievement initialization
     * Handles password hashing, activation link generation, and sends activation email
     * @param {Object} data - User registration data
     * @param {string} data.username - Unique username for the user
     * @param {string} data.email - Email address for login and verification
     * @param {string} data.password - Plain text password to be hashed
     * @param {string} [data.image] - Optional profile image URL
     * @returns {Promise<User>} Created user object with activation link
     * @throws {ApiError} Conflict error if email/username exists or database error
     */
    async create(data) {
        try {
            // Check if user already exists with same email or username
            const existingUser = await UserRepository.findByEmailOrUsername(data.email, data.username);

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

            // Hash password before saving for security
            const hashedPassword = await bcrypt.hash(data.password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

            // Generate unique activation link for email verification
            const activationLink = crypto.randomBytes(32).toString('hex');

            const user = await UserRepository.create({
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
                // Don't fail registration if email service is unavailable
            }

            // Initialize achievement system for new user
            try {
                await initializeUser(user.id);
            } catch (achievementError) {
                //console.error('Failed to initialize user achievements:', achievementError);
                // Don't fail registration if achievement initialization fails
            }

            return user;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error creating user', e);
        }
    }

    /**
     * Activates a user account using the provided activation link
     * Verifies the link, checks activation status, and marks user as activated
     * @param {string} activationLink - Unique activation token from email
     * @returns {Promise<User>} Activated user object with associations
     * @throws {ApiError} Bad request if link is invalid/expired or user already activated
     */
    async activate(activationLink) {
        try {
            if (!activationLink) {
                throw ApiError.badRequest('Activation link is required');
            }

            // Find user by activation link
            const user = await UserRepository.findByActivationLink(activationLink);

            if (!user) {
                throw ApiError.badRequest('Invalid activation link');
            }

            if (user.isActivated) {
                throw ApiError.badRequest('User is already activated');
            }

            // Activate user and clear activation link
            await UserRepository.activate(user.id);

            return await UserRepository.findByIdWithAssociations(user.id);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error activating user', e);
        }
    }

    /**
     * Resends activation email for users who haven't received or lost their activation link
     * Generates new activation link if needed and handles email delivery
     * @param {string} email - Email address of the user requesting resend
     * @returns {Promise<boolean>} True if email was sent successfully
     * @throws {ApiError} Not found if user doesn't exist, bad request if already activated
     */
    async resendActivationEmail(email) {
        try {
            if (!email) {
                throw ApiError.badRequest('Email is required');
            }

            // Find user by email address
            const user = await UserRepository.findByEmail(email);

            if (!user) {
                throw ApiError.notFound('User with this email not found');
            }

            if (user.isActivated) {
                throw ApiError.badRequest('User is already activated');
            }

            if (!user.activationLink) {
                // Generate new activation link if it doesn't exist
                const activationLink = crypto.randomBytes(32).toString('hex');
                await UserRepository.updateActivationLink(user.id, activationLink);
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

    /**
     * Verifies a plain text password against a hashed password
     * Used during login authentication and password change verification
     * @param {string} plainPassword - Plain text password to verify
     * @param {string} hashedPassword - Hashed password from database
     * @returns {Promise<boolean>} True if passwords match, false otherwise
     * @throws {ApiError} Bad request if verification process fails
     */
    async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (e) {
            throw ApiError.badRequest('Password verification failed');
        }
    }

    /**
     * Updates user balance based on transaction type and amount
     * Handles both income and outcome transactions with validation and achievement tracking
     * @param {Object} data - Balance update data
     * @param {number} data.amount - Transaction amount (must be positive)
     * @param {string} data.type - Transaction type from TRANSACTION_TYPES constants
     * @param {number} data.userId - ID of the user whose balance to update
     * @returns {Promise<Object>} Object containing the new balance
     * @returns {number} returns.newBalance - Updated user balance
     * @throws {ApiError} Business logic errors for insufficient balance or invalid data
     */
    async updateBalance(data) {
        try {
            const { amount, type, userId } = data;

            // Validate that amount is positive
            if (amount <= 0) {
                throw ApiError.businessLogic('Amount must be positive', ['Amount cannot be zero or negative']);
            }

            const user = await UserRepository.findByIdWithBalance(userId);

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            let addedAmountIsPositive = true;

            // Determine if transaction increases or decreases balance
            switch (type) {
                case TRANSACTION_TYPES.BALANCE_INCOME:
                case TRANSACTION_TYPES.EVENT_INCOME:
                case TRANSACTION_TYPES.GIFT:
                    addedAmountIsPositive = true;
                    break;
                case TRANSACTION_TYPES.BALANCE_OUTCOME:
                case TRANSACTION_TYPES.EVENT_OUTCOME:
                    addedAmountIsPositive = false;
                    break;
                default:
                    throw ApiError.businessLogic('Invalid transaction type', [
                        `Valid types are: ${Object.values(TRANSACTION_TYPES).join(', ')}`
                    ]);
            }

            const currentBalance = user.balance;
            const newBalance = addedAmountIsPositive 
                ? currentBalance + amount 
                : currentBalance - amount;

            // Prevent negative balance
            if (newBalance < 0) {
                throw ApiError.businessLogic('Insufficient balance', [
                    `Current balance: ${currentBalance}`,
                    `Required amount: ${amount}`,
                    `Shortfall: ${Math.abs(newBalance)}`
                ]);
            }

            await UserRepository.updateBalance(userId, newBalance);

            // Track balance changes for achievement system (non-blocking)
            try {
                await onUserBankUpdated(userId, newBalance);
            } catch (achievementError) {
                //console.error('Failed to update achievement tracking:', achievementError);
                // Don't fail balance update if achievement tracking fails
            }

            return { newBalance };
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Failed to update balance', e);
        }
    }

    /**
     * Retrieves all users with minimal data (only IDs)
     * Used for system statistics and bulk operations
     * @returns {Promise<User[]>} Array of users with minimal fields
     * @throws {ApiError} Bad request if operation fails
     */
    async getAllUsers() {
        try {
            return await UserRepository.findAllMinimal();
        } catch (e) {
            throw ApiError.badRequest('Error getting all users', e.message);
        }
    }

    /**
     * Finds a user by ID with only balance information
     * Optimized for quick balance checks without loading unnecessary data
     * @param {number} userId - ID of the user
     * @returns {Promise<User>} User object with ID and balance fields
     * @throws {ApiError} Bad request if user not found or operation fails
     */
    async findByIdWithBalance(userId) {
        try {
            return await UserRepository.findByIdWithBalance(userId);
        } catch (e) {
            throw ApiError.badRequest('Error finding user with balance', e.message);
        }
    }

    /**
     * Updates user profile information with comprehensive validation
     * Handles username, email, and password updates with conflict checking
     * @param {number} id - ID of the user to update
     * @param {Object} data - Update data
     * @param {string} [data.username] - New username (validated for uniqueness and format)
     * @param {string} [data.email] - New email (validated for format and uniqueness)
     * @param {string} [data.currentPassword] - Current password for verification
     * @param {string} [data.newPassword] - New password (requires currentPassword)
     * @returns {Promise<User>} Updated user object with associations
     * @throws {ApiError} Bad request for validation errors or conflicts
     */
    async update(id, data) {
        try {
            const user = await UserRepository.findByPk(id);
            if (!user) {
                throw ApiError.badRequest('User not found');
            }

            const updateData = {};

            // Update username with validation
            if (data.username && data.username !== user.username) {
                // Validate username length and format
                if (data.username.length < VALIDATION_LIMITS.USERNAME_MIN_LENGTH) {
                    throw ApiError.badRequest(`Username must be at least ${VALIDATION_LIMITS.USERNAME_MIN_LENGTH} characters long`);
                }
                if (data.username.length > VALIDATION_LIMITS.USERNAME_MAX_LENGTH) {
                    throw ApiError.badRequest(`Username cannot exceed ${VALIDATION_LIMITS.USERNAME_MAX_LENGTH} characters`);
                }
                if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
                    throw ApiError.badRequest('Username can only contain letters, numbers and underscore');
                }

                // Check for username uniqueness
                const existingUser = await UserRepository.findByUsername(data.username);
                if (existingUser && existingUser.id !== id) {
                    throw ApiError.badRequest('Username already exists');
                }
                updateData.username = data.username;
            }

            // Update email with validation
            if (data.email && data.email !== user.email) {
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    throw ApiError.badRequest('Please enter a valid email address');
                }

                // Check for email uniqueness
                const existingUser = await UserRepository.findByEmail(data.email);
                if (existingUser && existingUser.id !== id) {
                    throw ApiError.badRequest('Email already exists');
                }
                updateData.email = data.email;
            }

            // Update password with validation
            if (data.newPassword && data.currentPassword) {
                // Validate new password strength
                if (data.newPassword.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
                    throw ApiError.badRequest(`Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} characters long`);
                }
                if (data.newPassword.length > VALIDATION_LIMITS.PASSWORD_MAX_LENGTH) {
                    throw ApiError.badRequest(`Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX_LENGTH} characters`);
                }

                // Verify current password before allowing change
                const isCurrentPasswordValid = await this.verifyPassword(data.currentPassword, user.password);
                if (!isCurrentPasswordValid) {
                    throw ApiError.badRequest('Current password is incorrect');
                }
                
                // Hash new password before saving
                updateData.password = await bcrypt.hash(data.newPassword, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);
            }

            // Apply updates if any changes were made
            if (Object.keys(updateData).length > 0) {
                await UserRepository.update(id, updateData);
            }

            // Return updated user with all associations
            return await UserRepository.findByIdWithAssociations(id);
        } catch (e) {
            throw ApiError.badRequest(e.message || 'Failed to update user');
        }
    }

    /**
     * Finds a user by ID with optional associations
     * @param {number} userId - ID of the user to find
     * @param {boolean} includeAssociations - Whether to include events and accounts
     * @returns {Promise<User>} User object with or without associations
     * @throws {ApiError} Database error if user not found or operation fails
     */
    async findById(userId, includeAssociations = true) {
        try {
            return await UserRepository.findByIdWithAssociations(userId, includeAssociations);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding user by ID', e);
        }
    }

    /**
     * Finds all users with optional associations
     * @param {boolean} includeAssociations - Whether to include events data
     * @returns {Promise<User[]>} Array of users with or without associations
     * @throws {ApiError} Database error if operation fails
     */
    async findAll(includeAssociations = true) {
        try {
            return await UserRepository.findAllWithAssociations(includeAssociations);
        } catch (e) {
            throw ApiError.database('Error finding all users', e);
        }
    }

    /**
     * Searches for users by partial username match
     * @param {string} username - Partial username to search for
     * @param {boolean} includeAssociations - Whether to include events data
     * @returns {Promise<User[]>} Array of matching users
     * @throws {ApiError} Database error if search fails
     */
    async searchByUsername(username, includeAssociations = true) {
        try {
            return await UserRepository.searchByUsername(username, includeAssociations);
        } catch (e) {
            throw ApiError.database('Error searching users by username', e);
        }
    }

    /**
     * Finds all OAuth accounts linked to a user
     * @param {number} userId - ID of the user
     * @returns {Promise<Account[]>} Array of linked OAuth accounts
     * @throws {ApiError} Database error if operation fails
     */
    async findAccounts(userId) {
        try {
            const { AccountRepository } = require('../repository');
            return await AccountRepository.findByUserId(userId);
        } catch (e) {
            throw ApiError.database('Error finding user accounts', e);
        }
    }

    /**
     * Finds a user by email address
     * @param {string} email - Email address to search for
     * @returns {Promise<User|null>} User object or null if not found
     * @throws {ApiError} Database error if operation fails
     */
    async findByEmail(email) {
        try {
            return await UserRepository.findByEmail(email);
        } catch (e) {
            throw ApiError.database('Error finding user by email', e);
        }
    }

    /**
     * Finds a user by ID with accounts included
     * @param {number} userId - ID of the user
     * @returns {Promise<User>} User object with linked accounts
     * @throws {ApiError} Database error if user not found or operation fails
     */
    async findByIdWithAccountsOnly(userId) {
        try {
            return await UserRepository.findByIdWithAssociations(userId, true);
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding User by ID', e);
        }
    }

}

module.exports = new UserService();