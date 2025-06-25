// Use global mocks from setup.js

const authResolvers = require('../../graphql/schema/resolvers/authResolvers');
const { userService, tokenService, accountService } = require('../../service');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwtUtils');
const axios = require('axios');
const crypto = require('crypto');

describe('authResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation.login', () => {
    it('should successfully login user with correct credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        isActivated: true
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      userService.verifyPassword.mockResolvedValue(true);
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockUser);
      tokenService.saveToken.mockResolvedValue(true);

      const result = await authResolvers.Mutation.login(null, {
        email: 'test@example.com',
        password: 'password123'
      });

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userService.verifyPassword).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockUser);
      expect(tokenService.saveToken).toHaveBeenCalledWith(1, 'mock-refresh-token');
      
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser
      });
    });

    it('should throw an error if email is incorrect', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(authResolvers.Mutation.login(null, {
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toThrow('Invalid email or password');
    });

    it('should throw an error if password is incorrect', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword'
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      userService.verifyPassword.mockResolvedValue(false);

      await expect(authResolvers.Mutation.login(null, {
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid email or password');
    });

    it('should handle login errors gracefully', async () => {
      userService.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(authResolvers.Mutation.login(null, {
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('Database error');
    });
  });

  describe('Mutation.register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      userService.create.mockResolvedValue(mockUser);
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockUser);
      tokenService.saveToken.mockResolvedValue(true);

      const result = await authResolvers.Mutation.register(null, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      expect(userService.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser
      });
    });

    it('should throw an error if username already exists', async () => {
      userService.create.mockRejectedValue(new Error('Username already exists'));

      await expect(authResolvers.Mutation.register(null, {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('Username already exists');
    });

    it('should handle registration errors gracefully', async () => {
      userService.create.mockRejectedValue(new Error('Validation error'));

      await expect(authResolvers.Mutation.register(null, {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      })).rejects.toThrow('Validation error');
    });
  });

  describe('Mutation.discordAuth', () => {
    it('should successfully login user with correct Discord credentials', async () => {
      const mockDiscordUser = {
        id: 'discord123',
        email: 'discord@example.com',
        username: 'discorduser',
        discriminator: '1234',
        avatar: 'avatar123'
      };

      const mockAccount = {
        User: { id: 1, email: 'discord@example.com' }
      };

      axios.get.mockResolvedValue({ data: mockDiscordUser });
      accountService.findByProviderAndAccountId.mockResolvedValue(mockAccount);
      accountService.updateByProviderAndAccountId.mockResolvedValue(true);
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockAccount.User);
      tokenService.saveToken.mockResolvedValue(true);

      const result = await authResolvers.Mutation.discordAuth(null, {
        accessToken: 'discord-access-token'
      });

      expect(axios.get).toHaveBeenCalledWith('https://discord.com/api/users/@me', {
        headers: { 'Authorization': 'Bearer discord-access-token' }
      });
      
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockAccount.User
      });
    });

    it('should create a new user when logging in with Discord for the first time', async () => {
      const mockDiscordUser = {
        id: 'discord123',
        email: 'discord@example.com',
        username: 'discorduser',
        discriminator: '1234',
        avatar: 'avatar123'
      };

      const mockNewUser = {
        id: 2,
        email: 'discord@example.com',
        username: 'discorduser'
      };

      axios.get.mockResolvedValue({ data: mockDiscordUser });
      accountService.findByProviderAndAccountId.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockNewUser);
      accountService.create.mockResolvedValue({});
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockNewUser);
      tokenService.saveToken.mockResolvedValue(true);

      const result = await authResolvers.Mutation.discordAuth(null, {
        accessToken: 'discord-access-token'
      });

      expect(userService.create).toHaveBeenCalledWith({
        email: 'discord@example.com',
        username: 'discorduser',
        password: 'bW9jay1yYW5k',
        image: 'https://cdn.discordapp.com/avatars/discord123/avatar123.png'
      });

      expect(result.user).toEqual(mockNewUser);
    });

    it('should link to existing user by email when Discord account not found', async () => {
      const mockDiscordUser = {
        id: 'discord123',
        email: 'existing@example.com',
        username: 'discorduser',
        discriminator: '1234',
        avatar: 'avatar123'
      };

      const mockExistingUser = {
        id: 3,
        email: 'existing@example.com',
        username: 'existinguser'
      };

      axios.get.mockResolvedValue({ data: mockDiscordUser });
      accountService.findByProviderAndAccountId.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(mockExistingUser);
      accountService.create.mockResolvedValue({});
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockExistingUser);
      tokenService.saveToken.mockResolvedValue(true);

      const result = await authResolvers.Mutation.discordAuth(null, {
        accessToken: 'discord-access-token'
      });

      expect(userService.findByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(accountService.create).toHaveBeenCalledWith({
        id: `discord_discord123_3`,
        userId: 3,
        type: 'oauth',
        provider: 'discord',
        providerAccountId: 'discord123',
        access_token: 'discord-access-token',
        providerUsername: 'discorduser',
        providerAvatar: 'https://cdn.discordapp.com/avatars/discord123/avatar123.png',
        providerEmail: 'existing@example.com',
        providerDiscriminator: '1234'
      });

      expect(result.user).toEqual(mockExistingUser);
    });

    it('should handle Discord user with no avatar', async () => {
      const mockDiscordUser = {
        id: 'discord123',
        email: 'discord@example.com',
        username: 'discorduser',
        discriminator: '1234',
        avatar: null
      };

      const mockNewUser = {
        id: 2,
        email: 'discord@example.com',
        username: 'discorduser'
      };

      axios.get.mockResolvedValue({ data: mockDiscordUser });
      accountService.findByProviderAndAccountId.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockNewUser);
      accountService.create.mockResolvedValue({});
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockNewUser);
      tokenService.saveToken.mockResolvedValue(true);

      const result = await authResolvers.Mutation.discordAuth(null, {
        accessToken: 'discord-access-token'
      });

                    expect(userService.create).toHaveBeenCalledWith({
         email: 'discord@example.com',
         username: 'discorduser',
         password: 'bW9jay1yYW5k',
         image: null
       });
    });

         it('should handle Discord API errors', async () => {
       axios.get.mockRejectedValue(new Error('Discord API error'));

       await expect(authResolvers.Mutation.discordAuth(null, {
         accessToken: 'invalid-discord-token'
       })).rejects.toThrow('Discord API error');
    });
  });

  describe('Mutation.discordAuthCode', () => {
    it('should successfully authenticate with Discord auth code', async () => {
      const mockTokenResponse = { data: { access_token: 'discord-access-token' } };
      const mockDiscordUser = {
        id: 'discord123',
        email: 'discord@example.com',
        username: 'discorduser'
      };
      const mockAccount = {
        User: { id: 1, email: 'discord@example.com' }
      };

      axios.post.mockResolvedValue(mockTokenResponse);
      axios.get.mockResolvedValue({ data: mockDiscordUser });
      accountService.findByProviderAndAccountId.mockResolvedValue(mockAccount);
      accountService.updateByProviderAndAccountId.mockResolvedValue(true);
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockAccount.User);
      tokenService.saveToken.mockResolvedValue(true);

      const result = await authResolvers.Mutation.discordAuthCode(null, {
        code: 'auth-code',
        redirectUri: 'http://localhost:3000/callback',
        codeVerifier: 'code-verifier'
      });

      expect(axios.post).toHaveBeenCalledWith(
        'https://discord.com/api/oauth2/token',
        expect.any(URLSearchParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockAccount.User
      });
    });

    it('should authenticate without code verifier (non-PKCE flow)', async () => {
      const mockTokenResponse = { data: { access_token: 'discord-access-token' } };
      const mockDiscordUser = {
        id: 'discord123',
        email: 'discord@example.com',
        username: 'discorduser'
      };
      const mockAccount = {
        User: { id: 1, email: 'discord@example.com' }
      };

      axios.post.mockResolvedValue(mockTokenResponse);
      axios.get.mockResolvedValue({ data: mockDiscordUser });
      accountService.findByProviderAndAccountId.mockResolvedValue(mockAccount);
      accountService.updateByProviderAndAccountId.mockResolvedValue(true);
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockAccount.User);
      tokenService.saveToken.mockResolvedValue(true);

      await authResolvers.Mutation.discordAuthCode(null, {
        code: 'auth-code',
        redirectUri: 'http://localhost:3000/callback'
      });

      expect(axios.post).toHaveBeenCalled();
    });

         it('should handle failed token exchange', async () => {
       axios.post.mockResolvedValue({ data: {} });

       await expect(authResolvers.Mutation.discordAuthCode(null, {
         code: 'invalid-code',
         redirectUri: 'http://localhost:3000/callback'
       })).rejects.toThrow('Failed to get Discord access token');
    });

    it('should handle Discord token endpoint errors', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            error_description: 'Invalid authorization code'
          }
        }
      });

      await expect(authResolvers.Mutation.discordAuthCode(null, {
        code: 'invalid-code',
        redirectUri: 'http://localhost:3000/callback'
      })).rejects.toThrow('Invalid authorization code');
    });
  });

  describe('Mutation.linkDiscordAccount', () => {
    it('should successfully link a Discord account', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockDiscordUser = {
        id: 'discord123',
        email: 'discord@example.com',
        username: 'discorduser',
        discriminator: '1234',
        avatar: 'avatar123'
      };

      const mockTokenResponse = { data: { access_token: 'discord-token' } };
      const mockUserResponse = { data: mockDiscordUser };

      accountService.findByUserAndProvider.mockResolvedValue(null);
      axios.post.mockResolvedValue(mockTokenResponse);
      axios.get.mockResolvedValue(mockUserResponse);
      accountService.findByProviderAndAccountId.mockResolvedValue(null);
      accountService.create.mockResolvedValue({});
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockUser);

      const result = await authResolvers.Mutation.linkDiscordAccount(null, {
        code: 'auth-code',
        redirectUri: 'http://localhost:3000/callback',
        codeVerifier: 'code-verifier'
      }, { user: mockUser });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Discord account successfully linked');
      expect(result.user).toEqual(mockUser);
    });

    it('should return error if user is not authenticated', async () => {
      const result = await authResolvers.Mutation.linkDiscordAccount(null, {
        code: 'auth-code',
        redirectUri: 'http://localhost:3000/callback'
      }, { user: null });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Not authenticated');
    });

    it('should return error if Discord account already linked to this user', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockExistingAccount = { id: 'existing-account' };

      accountService.findByUserAndProvider.mockResolvedValue(mockExistingAccount);

      const result = await authResolvers.Mutation.linkDiscordAccount(null, {
        code: 'auth-code',
        redirectUri: 'http://localhost:3000/callback'
      }, { user: mockUser });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Discord account already linked to this user');
    });

    it('should return error if Discord account already linked to another user', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockDiscordUser = {
        id: 'discord123',
        email: 'discord@example.com',
        username: 'discorduser'
      };
      const mockExistingDiscordAccount = { id: 'existing-discord-account', userId: 2 };

      const mockTokenResponse = { data: { access_token: 'discord-token' } };

      accountService.findByUserAndProvider.mockResolvedValue(null);
      axios.post.mockResolvedValue(mockTokenResponse);
      axios.get.mockResolvedValue({ data: mockDiscordUser });
      accountService.findByProviderAndAccountId.mockResolvedValue(mockExistingDiscordAccount);

      const result = await authResolvers.Mutation.linkDiscordAccount(null, {
        code: 'auth-code',
        redirectUri: 'http://localhost:3000/callback'
      }, { user: mockUser });

      expect(result.success).toBe(false);
      expect(result.message).toBe('This Discord account is already linked to another user');
    });

    it('should handle token exchange failures gracefully', async () => {
      const mockUser = { id: 1, username: 'testuser' };

      accountService.findByUserAndProvider.mockResolvedValue(null);
      axios.post.mockResolvedValue({ data: {} });

      const result = await authResolvers.Mutation.linkDiscordAccount(null, {
        code: 'auth-code',
        redirectUri: 'http://localhost:3000/callback'
      }, { user: mockUser });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to get Discord access token');
    });

    it('should handle general errors gracefully', async () => {
      const mockUser = { id: 1, username: 'testuser' };

      accountService.findByUserAndProvider.mockRejectedValue(new Error('Database error'));

      const result = await authResolvers.Mutation.linkDiscordAccount(null, {
        code: 'auth-code',
        redirectUri: 'http://localhost:3000/callback'
      }, { user: mockUser });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
    });
  });

  describe('Mutation.refreshToken', () => {
    it('should successfully refresh the access token', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      
      verifyRefreshToken.mockReturnValue({ id: 1 });
      tokenService.findToken.mockResolvedValue(true);
      userService.findById.mockResolvedValue(mockUser);
      userService.findByIdWithAccountsOnly.mockResolvedValue(mockUser);

      const result = await authResolvers.Mutation.refreshToken(null, {
        refreshToken: 'valid-refresh-token'
      });

      expect(verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(tokenService.findToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(userService.findById).toHaveBeenCalledWith(1, false);
      
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'valid-refresh-token',
        user: mockUser
      });
    });

    it('should throw an error if refresh token is not provided', async () => {
      await expect(authResolvers.Mutation.refreshToken(null, {
        refreshToken: null
      })).rejects.toThrow('Refresh token is required');
    });

    it('should throw an error if the refresh token is invalid', async () => {
      verifyRefreshToken.mockReturnValue(null);

      await expect(authResolvers.Mutation.refreshToken(null, {
        refreshToken: 'invalid-refresh-token'
      })).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw an error if the refresh token is not found in the database', async () => {
      verifyRefreshToken.mockReturnValue({ id: 1 });
      tokenService.findToken.mockResolvedValue(null);

      await expect(authResolvers.Mutation.refreshToken(null, {
        refreshToken: 'token-not-in-db'
      })).rejects.toThrow('Refresh token not found in database');
    });

    it('should throw an error if user is not found', async () => {
      verifyRefreshToken.mockReturnValue({ id: 1 });
      tokenService.findToken.mockResolvedValue(true);
      userService.findById.mockResolvedValue(null);

      await expect(authResolvers.Mutation.refreshToken(null, {
        refreshToken: 'valid-refresh-token'
      })).rejects.toThrow('User account not found');
    });

    it('should handle JWT expired error', async () => {
      const jwtError = new Error('jwt expired');
      jwtError.name = 'TokenExpiredError';
      verifyRefreshToken.mockImplementation(() => {
        throw jwtError;
      });

      await expect(authResolvers.Mutation.refreshToken(null, {
        refreshToken: 'expired-token'
      })).rejects.toThrow('Refresh token expired');
    });

    it('should handle invalid token error', async () => {
      const jwtError = new Error('invalid token');
      jwtError.name = 'JsonWebTokenError';
      verifyRefreshToken.mockImplementation(() => {
        throw jwtError;
      });

      await expect(authResolvers.Mutation.refreshToken(null, {
        refreshToken: 'invalid-token'
      })).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('Mutation.logout', () => {
    it('should successfully logout and remove the refresh token', async () => {
      tokenService.removeToken.mockResolvedValue(true);

      const result = await authResolvers.Mutation.logout(null, {
        refreshToken: 'valid-refresh-token'
      });

      expect(tokenService.removeToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toBe(true);
    });

    it('should throw an error if the refresh token is not found', async () => {
      tokenService.removeToken.mockResolvedValue(false);

      await expect(authResolvers.Mutation.logout(null, {
        refreshToken: 'nonexistent-token'
      })).rejects.toThrow('Refresh token not found');
    });

    it('should handle logout errors gracefully', async () => {
      tokenService.removeToken.mockRejectedValue(new Error('Database error'));

      await expect(authResolvers.Mutation.logout(null, {
        refreshToken: 'valid-refresh-token'
      })).rejects.toThrow('Database error');
    });
  });

  describe('Mutation.activateUser', () => {
    it('should successfully activate user', async () => {
      const mockUser = { id: 1, isActivated: true };
      userService.activate.mockResolvedValue(mockUser);

      const result = await authResolvers.Mutation.activateUser(null, {
        activationLink: 'valid-activation-link'
      });

      expect(userService.activate).toHaveBeenCalledWith('valid-activation-link');
      expect(result).toEqual(mockUser);
    });

    it('should handle activation errors', async () => {
      userService.activate.mockRejectedValue(new Error('Invalid activation link'));

      await expect(authResolvers.Mutation.activateUser(null, {
        activationLink: 'invalid-link'
      })).rejects.toThrow('Invalid activation link');
    });

    it('should handle generic activation errors', async () => {
      userService.activate.mockRejectedValue(new Error());

      await expect(authResolvers.Mutation.activateUser(null, {
        activationLink: 'some-link'
      })).rejects.toThrow('User activation failed');
    });
  });

  describe('Mutation.resendActivationEmail', () => {
    it('should successfully resend activation email', async () => {
      userService.resendActivationEmail.mockResolvedValue(true);

      const result = await authResolvers.Mutation.resendActivationEmail(null, {
        email: 'test@example.com'
      });

      expect(userService.resendActivationEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe(true);
    });

    it('should handle resend activation email errors', async () => {
      userService.resendActivationEmail.mockRejectedValue(new Error('User not found'));

      await expect(authResolvers.Mutation.resendActivationEmail(null, {
        email: 'nonexistent@example.com'
      })).rejects.toThrow('User not found');
    });

    it('should handle generic resend activation email errors', async () => {
      userService.resendActivationEmail.mockRejectedValue(new Error());

      await expect(authResolvers.Mutation.resendActivationEmail(null, {
        email: 'test@example.com'
      })).rejects.toThrow('Failed to resend activation email');
    });
  });
}); 