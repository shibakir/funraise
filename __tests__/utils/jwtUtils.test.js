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
                { expiresIn: '30m' }
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
                { expiresIn: '30m' }
            );
            expect(result).toBe(mockToken);
        });
    });

    describe('environment variable fallback coverage', () => {
        it('should use current environment JWT secrets when available', () => {
            // This test verifies the "truthy" branch of the || operator
            // Since JWT_SECRET and JWT_REFRESH_SECRET are already set in beforeAll,
            // this should use those values, not the fallbacks
            
            const mockToken = 'env-token';
            jwt.sign.mockReturnValue(mockToken);

            jwtUtils.generateToken(mockUser);
            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                'test-jwt-secret', // environment value, not fallback
                expect.any(Object)
            );

            jwtUtils.generateRefreshToken(mockUser);
            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                'test-refresh-secret', // environment value, not fallback
                expect.any(Object)
            );
        });

        it('should use fallback secrets when environment variables are undefined', () => {
            // Create a completely isolated test environment
            jest.isolateModules(() => {
                // Mock the environment variables to be undefined 
                const originalEnv = process.env;
                process.env = { ...originalEnv };
                delete process.env.JWT_SECRET;
                delete process.env.JWT_REFRESH_SECRET;
                
                const mockToken = 'fallback-token';
                jwt.sign.mockReturnValue(mockToken);
                jwt.verify.mockReturnValue({ id: 1 });
                
                // Require fresh module instance with cleared environment
                const isolatedJwtUtils = require('../../utils/jwtUtils');

                // Test fallback for JWT_SECRET (covers line 4)
                isolatedJwtUtils.generateToken(mockUser);
                expect(jwt.sign).toHaveBeenCalledWith(
                    expect.any(Object),
                    'some_secret_key', // fallback value from line 4
                    expect.any(Object)
                );

                // Clear previous calls for clean verification
                jest.clearAllMocks();
                jwt.sign.mockReturnValue(mockToken);

                // Test fallback for JWT_REFRESH_SECRET (covers line 5)
                isolatedJwtUtils.generateRefreshToken(mockUser);
                expect(jwt.sign).toHaveBeenCalledWith(
                    expect.any(Object),
                    'refresh_secret_key', // fallback value from line 5
                    expect.any(Object)
                );
                
                // Test verification with fallback secrets
                jwt.verify.mockReturnValue({ id: 1 });
                isolatedJwtUtils.verifyToken('test-token');
                expect(jwt.verify).toHaveBeenCalledWith('test-token', 'some_secret_key');
                
                isolatedJwtUtils.verifyRefreshToken('test-refresh-token');
                expect(jwt.verify).toHaveBeenCalledWith('test-refresh-token', 'refresh_secret_key');
                
                // Restore environment
                process.env = originalEnv;
            });
        });
    });

    describe('edge cases and additional error handling', () => {
        it('should handle null token in verifyToken', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Token is null');
            });

            const result = jwtUtils.verifyToken(null);
            expect(result).toBeNull();
        });

        it('should handle undefined token in verifyToken', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Token is undefined');
            });

            const result = jwtUtils.verifyToken(undefined);
            expect(result).toBeNull();
        });

        it('should handle empty string token in verifyToken', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Token is empty');
            });

            const result = jwtUtils.verifyToken('');
            expect(result).toBeNull();
        });

        it('should handle null token in verifyRefreshToken', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Token is null');
            });

            const result = jwtUtils.verifyRefreshToken(null);
            expect(result).toBeNull();
        });

        it('should handle undefined token in verifyRefreshToken', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Token is undefined');
            });

            const result = jwtUtils.verifyRefreshToken(undefined);
            expect(result).toBeNull();
        });

        it('should handle empty string token in verifyRefreshToken', () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Token is empty');
            });

            const result = jwtUtils.verifyRefreshToken('');
            expect(result).toBeNull();
        });

        it('should handle user with null values in generateToken', () => {
            const userWithNulls = {
                id: null,
                email: null,
                username: null
            };
            const mockToken = 'token-with-nulls';
            jwt.sign.mockReturnValue(mockToken);

            const result = jwtUtils.generateToken(userWithNulls);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: null,
                    email: null,
                    username: null
                },
                'test-jwt-secret',
                { expiresIn: '30m' }
            );
            expect(result).toBe(mockToken);
        });

        it('should handle user with null values in generateRefreshToken', () => {
            const userWithNulls = {
                id: null,
                email: null,
                username: null
            };
            const mockToken = 'refresh-token-with-nulls';
            jwt.sign.mockReturnValue(mockToken);

            const result = jwtUtils.generateRefreshToken(userWithNulls);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: null,
                    email: null,
                    username: null
                },
                'test-refresh-secret',
                { expiresIn: '7d' }
            );
            expect(result).toBe(mockToken);
        });

        it('should handle specific JWT library errors', () => {
            const specificErrors = [
                new Error('jwt signature is required'),
                new Error('invalid token'),
                new Error('jwt malformed'),
                new Error('jwt audience invalid'),
                new Error('jwt issuer invalid'),
                new Error('jwt id invalid'),
                new Error('jwt subject invalid')
            ];

            specificErrors.forEach(error => {
                jwt.verify.mockImplementation(() => {
                    throw error;
                });

                const accessResult = jwtUtils.verifyToken('test-token');
                const refreshResult = jwtUtils.verifyRefreshToken('test-refresh-token');

                expect(accessResult).toBeNull();
                expect(refreshResult).toBeNull();
            });
        });
    });

    describe('additional edge cases', () => {
        it('should handle user with partial data', () => {
            const partialUser = {
                id: 42,
                email: null,
                username: undefined
            };
            const mockToken = 'partial-user-token';
            jwt.sign.mockReturnValue(mockToken);

            const result = jwtUtils.generateToken(partialUser);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: 42,
                    email: null,
                    username: undefined
                },
                'test-jwt-secret',
                { expiresIn: '30m' }
            );
            expect(result).toBe(mockToken);
        });
    });
}); 