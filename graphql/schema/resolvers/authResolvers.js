const { userService, tokenService, accountService } = require('../../../service');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../../utils/jwtUtils');
const axios = require('axios');
const crypto = require('crypto');

/**
 * GraphQL resolvers for Authentication operations
 * Handles user login, registration, and authenticated user queries
 */
const authResolvers = {
    Query: {},
    Mutation: {
        /**
         * Authenticates a user with email and password
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.email - User's email address
         * @param {string} args.password - User's password
         * @returns {Promise<Object>} Authentication response with tokens and user data
         * @returns {string} returns.accessToken - JWT access token for API requests
         * @returns {string} returns.refreshToken - JWT refresh token for token renewal
         * @returns {User} returns.user - Authenticated user object with related data
         * @throws {Error} If email/password is invalid or authentication fails
         */
        login: async (_, { email, password }) => {
            try {
                // Find user by email address
                const user = await userService.findByEmail(email);

                if (!user) {
                    throw new Error('Invalid email or password');
                }

                // Check if user is activated
                /*
                if (!user.isActivated) {
                    throw new Error('Account is not activated. Please check your email for activation link.');
                }
                */

                // Verify password using userService
                const isPasswordValid = await userService.verifyPassword(password, user.password);
                if (!isPasswordValid) {
                    throw new Error('Invalid email or password');
                }

                // Generate JWT tokens for authentication
                const accessToken = generateToken(user);
                const refreshToken = generateRefreshToken(user);

                // Save refresh token to database
                await tokenService.saveToken(user.id, refreshToken);

                // Get complete user information with associations
                const fullUser = await userService.findByIdWithAccountsOnly(user.id);

                return {
                    accessToken,
                    refreshToken,
                    user: fullUser
                };
            } catch (error) {
                console.error('Login error:', error);
                throw new Error(error.message || 'Login failed');
            }
        },
        
        /**
         * Registers a new user account and logs them in
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.username - Desired username (must be unique)
         * @param {string} args.email - Email address (must be unique and valid)
         * @param {string} args.password - Password for the account
         * @returns {Promise<Object>} Authentication response with tokens and user data
         * @returns {string} returns.accessToken - JWT access token for API requests
         * @returns {string} returns.refreshToken - JWT refresh token for token renewal
         * @returns {User} returns.user - Newly created user object with related data
         * @throws {Error} If registration fails due to validation errors or conflicts
         */
        register: async (_, { username, email, password }) => {
            try {
                // Create new user account through userService
                const user = await userService.create({
                    username,
                    email,
                    password
                });

                // Generate JWT tokens for immediate authentication
                const accessToken = generateToken(user);
                const refreshToken = generateRefreshToken(user);

                // Save refresh token to database
                await tokenService.saveToken(user.id, refreshToken);

                // Get complete user information with associations
                const fullUser = await userService.findByIdWithAccountsOnly(user.id);

                return {
                    accessToken,
                    refreshToken,
                    user: fullUser
                };
            } catch (error) {
                //console.error('Registration error:', error);
                throw new Error(error.message || 'Registration failed');
            }
        },

        /**
         * Authenticates a user with Discord OAuth
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.accessToken - Discord access token from OAuth flow
         * @returns {Promise<Object>} Authentication response with tokens and user data
         * @returns {string} returns.accessToken - JWT access token for API requests
         * @returns {string} returns.refreshToken - JWT refresh token for token renewal
         * @returns {User} returns.user - Authenticated user object with related data
         * @throws {Error} If Discord authentication fails
         */
        discordAuth: async (_, { accessToken }) => {
            try {
                // Get Discord user data using access token
                const discordResponse = await axios.get('https://discord.com/api/users/@me', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                const discordUser = discordResponse.data;
                const discordId = discordUser.id;
                const discordEmail = discordUser.email;
                const discordUsername = discordUser.username;
                const discordDiscriminator = discordUser.discriminator;
                const discordAvatar = discordUser.avatar ? 
                    `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png` : null;

                // Check if account already exists
                let account = await accountService.findByProviderAndAccountId('discord', discordId);

                let user;

                if (account) {
                    // User exists, update account data
                    await accountService.updateByProviderAndAccountId('discord', discordId, {
                        access_token: accessToken,
                        providerUsername: discordUsername,
                        providerAvatar: discordAvatar,
                        providerEmail: discordEmail,
                        providerDiscriminator: discordDiscriminator
                    });
                    user = account.User;
                } else {
                    // Check if user exists by email
                    user = await userService.findByEmail(discordEmail);

                    if (!user) {
                        // Create new user
                        user = await userService.create({
                            email: discordEmail,
                            username: discordUsername,
                            password: crypto.randomBytes(12).toString('base64').slice(0, 12),
                            image: discordAvatar,
                        });
                    }

                    // Create new Discord account
                    account = await accountService.create({
                        id: `discord_${discordId}_${user.id}`,
                        userId: user.id,
                        type: 'oauth',
                        provider: 'discord',
                        providerAccountId: discordId,
                        access_token: accessToken,
                        providerUsername: discordUsername,
                        providerAvatar: discordAvatar,
                        providerEmail: discordEmail,
                        providerDiscriminator: discordDiscriminator
                    });
                }

                // Generate JWT tokens for authentication
                const jwtAccessToken = generateToken(user);
                const refreshToken = generateRefreshToken(user);

                // Save refresh token to database
                await tokenService.saveToken(user.id, refreshToken);

                // Get complete user information with associations
                const fullUser = await userService.findByIdWithAccountsOnly(user.id);

                return {
                    accessToken: jwtAccessToken,
                    refreshToken,
                    user: fullUser
                };
            } catch (error) {
                //console.error('Discord auth error:', error);
                throw new Error(error.message || 'Discord authentication failed');
            }
        },

        /**
         * Authenticates a user with Discord OAuth authorization code
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.code - Discord authorization code from OAuth flow
         * @param {string} args.redirectUri - Redirect URI used in OAuth flow
         * @param {string} args.codeVerifier - PKCE code verifier
         * @returns {Promise<Object>} Authentication response with tokens and user data
         * @throws {Error} If Discord authentication fails
         */
        discordAuthCode: async (_, { code, redirectUri, codeVerifier }) => {
            try {
                // Prepare token exchange parameters
                const tokenParams = {
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                };

                // Add code_verifier if provided (PKCE flow)
                if (codeVerifier) {
                    tokenParams.code_verifier = codeVerifier;
                }

                // Exchange authorization code for access token
                const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
                    new URLSearchParams(tokenParams), 
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        }
                    }
                );

                const { access_token } = tokenResponse.data;

                if (!access_token) {
                    throw new Error('Failed to get Discord access token');
                }

                // Now use the existing discordAuth logic
                return authResolvers.Mutation.discordAuth(_, { accessToken: access_token });
            } catch (error) {
                console.error('Discord auth code error:', error.response?.data || error);
                throw new Error(error.response?.data?.error_description || 'Discord authentication failed');
            }
        },

        /**
         * Links existing account with Discord OAuth
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.code - Discord authorization code from OAuth flow
         * @param {string} args.redirectUri - Redirect URI used in OAuth flow
         * @param {string} args.codeVerifier - PKCE code verifier
         * @param {Object} context - GraphQL context
         * @param {User} context.user - Currently authenticated user
         * @returns {Promise<User>} Updated user object with linked Discord account
         * @throws {Error} If user is not authenticated or Discord account already linked
         */
        linkDiscordAccount: async (_, { code, redirectUri, codeVerifier }, { user }) => {
            if (!user) {
                return {
                    success: false,
                    message: 'Not authenticated',
                    user: null
                };
            }

            try {
                // Check if user already has Discord account linked
                const existingAccount = await accountService.findByUserAndProvider(user.id, 'discord');

                if (existingAccount) {
                    return {
                        success: false,
                        message: 'Discord account already linked to this user',
                        user: null
                    };
                }

                // Prepare token exchange parameters
                const tokenParams = {
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                };

                // Add code_verifier if provided (PKCE flow)
                if (codeVerifier) {
                    tokenParams.code_verifier = codeVerifier;
                }

                // Exchange authorization code for access token
                const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
                    new URLSearchParams(tokenParams), 
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        }
                    }
                );

                const { access_token } = tokenResponse.data;

                if (!access_token) {
                    return {
                        success: false,
                        message: 'Failed to get Discord access token',
                        user: null
                    };
                }

                // Get Discord user data using access token
                const discordResponse = await axios.get('https://discord.com/api/users/@me', {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                });

                const discordUser = discordResponse.data;
                const discordId = discordUser.id;
                const discordEmail = discordUser.email;
                const discordUsername = discordUser.username;
                const discordDiscriminator = discordUser.discriminator;
                const discordAvatar = discordUser.avatar ? 
                    `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png` : null;

                // Check if this Discord account is already linked to another user
                const existingDiscordAccount = await accountService.findByProviderAndAccountId('discord', discordId);

                if (existingDiscordAccount) {
                    return {
                        success: false,
                        message: 'This Discord account is already linked to another user',
                        user: null
                    };
                }

                // Create new Discord account link
                await accountService.create({
                    id: `discord_${discordId}_${user.id}`,
                    userId: user.id,
                    type: 'oauth',
                    provider: 'discord',
                    providerAccountId: discordId,
                    access_token: access_token,
                    providerUsername: discordUsername,
                    providerAvatar: discordAvatar,
                    providerEmail: discordEmail,
                    providerDiscriminator: discordDiscriminator
                });

                // Return updated user with accounts
                const updatedUser = await userService.findByIdWithAccountsOnly(user.id);

                return {
                    success: true,
                    message: 'Discord account successfully linked',
                    user: updatedUser
                };
            } catch (error) {
                console.error('Link Discord account error:', error);
                return {
                    success: false,
                    message: error.message || 'Failed to link Discord account',
                    user: null
                };
            }
        },

        /**
         * Refreshes access token using refresh token
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.refreshToken - Refresh token for obtaining new access token
         * @returns {Promise<Object>} Authentication response with new tokens and user data
         * @throws {Error} If refresh token is invalid or expired
         */
        refreshToken: async (_, { refreshToken }) => {
            try {
                //console.log('RefreshToken mutation called');
                
                if (!refreshToken) {
                    //console.log('No refresh token provided');
                    throw new Error('Refresh token is required');
                }

                // Verify refresh token
                //console.log('Verifying refresh token...');
                const decoded = verifyRefreshToken(refreshToken);
                if (!decoded) {
                    //console.log('Refresh token verification failed - token is invalid or expired');
                    throw new Error('Invalid or expired refresh token');
                }

                //console.log('Refresh token verified for user:', decoded.id);

                // Check if token exists in database
                //console.log('Checking if refresh token exists in database...');
                const tokenInDb = await tokenService.findToken(refreshToken);
                if (!tokenInDb) {
                    //console.log('Refresh token not found in database');
                    throw new Error('Refresh token not found in database');
                }

                //console.log('Refresh token found in database');

                // Find user by ID from token
                //console.log('Looking up user by ID:', decoded.id);
                const user = await userService.findById(decoded.id, false);
                if (!user) {
                    //console.log('User not found for id:', decoded.id);
                    throw new Error('User not found');
                }

                //console.log('User found:', user.username);

                // Generate new access token only (keep the same refresh token)
                //console.log('Generating new access token...');
                const newAccessToken = generateToken(user);

                //console.log('New access token generated successfully');

                // Get complete user information with associations
                const fullUser = await userService.findByIdWithAccountsOnly(user.id);

                return {
                    accessToken: newAccessToken,
                    refreshToken: refreshToken, // Return the same refresh token
                    user: fullUser
                };
            } catch (error) {
                console.error('Refresh token error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                
                // Return specific error messages for different scenarios
                if (error.message.includes('jwt expired')) {
                    throw new Error('Refresh token expired');
                } else if (error.message.includes('invalid token')) {
                    throw new Error('Invalid refresh token');
                } else if (error.message.includes('not found in database')) {
                    throw new Error('Refresh token not found in database');
                } else if (error.message.includes('User not found')) {
                    throw new Error('User account not found');
                } else {
                    throw new Error(error.message || 'Token refresh failed');
                }
            }
        },

        /**
         * Logout user and invalidate refresh token
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.refreshToken - Refresh token to invalidate
         * @returns {Promise<boolean>} True if logout was successful
         * @throws {Error} If logout fails
         */
        logout: async (_, { refreshToken }) => {
            try {
                // Remove refresh token from database
                const removed = await tokenService.removeToken(refreshToken);
                
                if (!removed) {
                    throw new Error('Refresh token not found');
                }

                return true;
            } catch (error) {
                console.error('Logout error:', error);
                throw new Error(error.message || 'Logout failed');
            }
        },

        /**
         * Activate user account using activation link
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.activationLink - Activation link from email
         * @returns {Promise<User>} Activated user object
         * @throws {Error} If activation fails
         */
        activateUser: async (_, { activationLink }) => {
            try {
                // Activate user through userService
                const user = await userService.activate(activationLink);

                return user;
            } catch (error) {
                console.error('User activation error:', error);
                throw new Error(error.message || 'User activation failed');
            }
        },

        /**
         * Resend activation email to user
         * @param {Object} _ - Parent object (unused)
         * @param {Object} args - Mutation arguments
         * @param {string} args.email - User's email address
         * @returns {Promise<boolean>} True if email was sent successfully
         * @throws {Error} If resending fails
         */
        resendActivationEmail: async (_, { email }) => {
            try {
                // Resend activation email through userService
                const result = await userService.resendActivationEmail(email);

                return result;
            } catch (error) {
                console.error('Resend activation email error:', error);
                throw new Error(error.message || 'Failed to resend activation email');
            }
        }
    }
};

module.exports = authResolvers; 