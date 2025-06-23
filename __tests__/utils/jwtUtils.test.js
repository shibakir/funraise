const jwt = require('jsonwebtoken');

// Unmock jwtUtils for this specific test file
jest.unmock('../../utils/jwtUtils');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('jwtUtils', () => {
    let jwtUtils;
    const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser'
    };

    const originalEnv = process.env;

    beforeAll(() => {
        // Set up environment variables for testing
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    });

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        
        // Clear the module cache to force re-instantiation
        delete require.cache[require.resolve('../../utils/jwtUtils')];
        
        // Require the module fresh
        jwtUtils = require('../../utils/jwtUtils');
    });

    afterAll(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('generateToken', () => {
        it('should generate access token with correct payload and options', () => {
            const mockToken = 'mock-access-token';
            jwt.sign.mockReturnValue(mockToken);

            const result = jwtUtils.generateToken(mockUser);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: mockUser.id,
                    email: mockUser.email,
                    username: mockUser.username
                },
                'test-jwt-secret',
                { expiresIn: '15m' }
            );
            expect(result).toBe(mockToken);
        });

        it('should use environment JWT secret when available', () => {
            const mockToken = 'mock-access-token';
            jwt.sign.mockReturnValue(mockToken);

            jwtUtils.generateToken(mockUser);

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                'test-jwt-secret',
                expect.any(Object)
            );
        });

        it('should include all required user fields in payload', () => {
            const mockToken = 'mock-access-token';
            jwt.sign.mockReturnValue(mockToken);

            jwtUtils.generateToken(mockUser);

            const expectedPayload = {
                id: mockUser.id,
                email: mockUser.email,
                username: mockUser.username
            };

            expect(jwt.sign).toHaveBeenCalledWith(
                expectedPayload,
                expect.any(String),
                expect.any(Object)
            );
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate refresh token with correct payload and options', () => {
            const mockToken = 'mock-refresh-token';
            jwt.sign.mockReturnValue(mockToken);

            const result = jwtUtils.generateRefreshToken(mockUser);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: mockUser.id,
                    email: mockUser.email,
                    username: mockUser.username
                },
                'test-refresh-secret',
                { expiresIn: '7d' }
            );
            expect(result).toBe(mockToken);
        });

        it('should use environment refresh secret when available', () => {
            const mockToken = 'mock-refresh-token';
            jwt.sign.mockReturnValue(mockToken);

            jwtUtils.generateRefreshToken(mockUser);

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                'test-refresh-secret',
                expect.any(Object)
            );
        });

        it('should include all required user fields in payload', () => {
            const mockToken = 'mock-refresh-token';
            jwt.sign.mockReturnValue(mockToken);

            jwtUtils.generateRefreshToken(mockUser);

            const expectedPayload = {
                id: mockUser.id,
                email: mockUser.email,
                username: mockUser.username
            };

            expect(jwt.sign).toHaveBeenCalledWith(
                expectedPayload,
                expect.any(String),
                expect.any(Object)
            );
        });
    });

    describe('verifyToken', () => {
        it('should verify token successfully and return payload', () => {
            const mockToken = 'valid-token';
            const mockPayload = {
                id: mockUser.id,
                email: mockUser.email,
                username: mockUser.username
            };
            jwt.verify.mockReturnValue(mockPayload);

            const result = jwtUtils.verifyToken(mockToken);

            expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-jwt-secret');
            expect(result).toBe(mockPayload);
        });

        it('should return null when token verification fails', () => {
            const mockToken = 'invalid-token';
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = jwtUtils.verifyToken(mockToken);

            expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-jwt-secret');
            expect(result).toBeNull();
        });

        it('should handle different JWT errors gracefully', () => {
            const mockToken = 'expired-token';
            
            // Test with different error types
            const errors = [
                new jwt.JsonWebTokenError('invalid token'),
                new jwt.TokenExpiredError('jwt expired', new Date()),
                new jwt.NotBeforeError('jwt not active', new Date()),
                new Error('Generic error')
            ];

            errors.forEach(error => {
                jwt.verify.mockImplementation(() => {
                    throw error;
                });

                const result = jwtUtils.verifyToken(mockToken);
                expect(result).toBeNull();
            });
        });
    });

    describe('verifyRefreshToken', () => {
        it('should verify refresh token successfully and return payload', () => {
            const mockToken = 'valid-refresh-token';
            const mockPayload = {
                id: mockUser.id,
                email: mockUser.email,
                username: mockUser.username
            };
            jwt.verify.mockReturnValue(mockPayload);

            const result = jwtUtils.verifyRefreshToken(mockToken);

            expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-refresh-secret');
            expect(result).toBe(mockPayload);
        });

        it('should return null when refresh token verification fails', () => {
            const mockToken = 'invalid-refresh-token';
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid refresh token');
            });

            const result = jwtUtils.verifyRefreshToken(mockToken);

            expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-refresh-secret');
            expect(result).toBeNull();
        });

        it('should handle different JWT errors gracefully for refresh tokens', () => {
            const mockToken = 'expired-refresh-token';
            
            // Test with different error types
            const errors = [
                new jwt.JsonWebTokenError('invalid token'),
                new jwt.TokenExpiredError('jwt expired', new Date()),
                new jwt.NotBeforeError('jwt not active', new Date()),
                new Error('Generic error')
            ];

            errors.forEach(error => {
                jwt.verify.mockImplementation(() => {
                    throw error;
                });

                const result = jwtUtils.verifyRefreshToken(mockToken);
                expect(result).toBeNull();
            });
        });
    });

    describe('token integration', () => {
        it('should generate and verify tokens in a full cycle', () => {
            // Mock successful generation
            const mockAccessToken = 'generated-access-token';
            const mockRefreshToken = 'generated-refresh-token';
            
            jwt.sign.mockReturnValueOnce(mockAccessToken);
            jwt.sign.mockReturnValueOnce(mockRefreshToken);

            // Generate tokens
            const accessToken = jwtUtils.generateToken(mockUser);
            const refreshToken = jwtUtils.generateRefreshToken(mockUser);

            expect(accessToken).toBe(mockAccessToken);
            expect(refreshToken).toBe(mockRefreshToken);

            // Mock successful verification
            const mockPayload = {
                id: mockUser.id,
                email: mockUser.email,
                username: mockUser.username
            };
            
            jwt.verify.mockReturnValueOnce(mockPayload);
            jwt.verify.mockReturnValueOnce(mockPayload);

            // Verify tokens
            const verifiedAccess = jwtUtils.verifyToken(accessToken);
            const verifiedRefresh = jwtUtils.verifyRefreshToken(refreshToken);

            expect(verifiedAccess).toEqual(mockPayload);
            expect(verifiedRefresh).toEqual(mockPayload);
        });

        it('should handle edge cases with empty or undefined user data', () => {
            const emptyUser = {};
            const mockToken = 'mock-token';
            
            jwt.sign.mockReturnValue(mockToken);

            const result = jwtUtils.generateToken(emptyUser);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: undefined,
                    email: undefined,
                    username: undefined
                },
                'test-jwt-secret',
                { expiresIn: '15m' }
            );
            expect(result).toBe(mockToken);
        });
    });
}); 