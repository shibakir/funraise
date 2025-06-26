const { AUTH_CONFIG } = require('../../constants');

describe('jwtUtils Constants Integration', () => {
    const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser'
    };

    describe('token expiration configuration', () => {
        it('should use correct expiration times from constants', () => {
            expect(AUTH_CONFIG.JWT_EXPIRES_IN).toBe('30m');
            expect(AUTH_CONFIG.REFRESH_EXPIRES_IN).toBe('7d');
        });
    });

    describe('bcrypt configuration', () => {
        it('should have reasonable salt rounds for security', () => {
            expect(AUTH_CONFIG.BCRYPT_SALT_ROUNDS).toBe(12);
            expect(AUTH_CONFIG.BCRYPT_SALT_ROUNDS).toBeGreaterThanOrEqual(10);
        });
    });
}); 