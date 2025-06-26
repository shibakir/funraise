const TokenRepository = require('../../repository/TokenRepository');
const { Token } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  Token: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'Token'
  }
}));

describe('TokenRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByRefreshToken', () => {
    it('should find token by refresh token', async () => {
      const mockToken = { id: 1, refreshToken: 'test-token', userId: 1 };
      Token.findOne.mockResolvedValue(mockToken);

      const result = await TokenRepository.findByRefreshToken('test-token');

      expect(Token.findOne).toHaveBeenCalledWith({
        where: { refreshToken: 'test-token' }
      });
      expect(result).toEqual(mockToken);
    });

    it('should return null if token not found', async () => {
      Token.findOne.mockResolvedValue(null);

      const result = await TokenRepository.findByRefreshToken('non-existent');

      expect(result).toBeNull();
    });

    it('should throw ApiError on database error', async () => {
      Token.findOne.mockRejectedValue(new Error('Database error'));

      await expect(TokenRepository.findByRefreshToken('test-token'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByUserId', () => {
    it('should find token by user ID', async () => {
      const mockToken = { id: 1, refreshToken: 'test-token', userId: 1 };
      Token.findOne.mockResolvedValue(mockToken);

      const result = await TokenRepository.findByUserId(1);

      expect(Token.findOne).toHaveBeenCalledWith({
        where: { userId: 1 }
      });
      expect(result).toEqual(mockToken);
    });

    it('should return null if token not found', async () => {
      Token.findOne.mockResolvedValue(null);

      const result = await TokenRepository.findByUserId(999);

      expect(result).toBeNull();
    });
  });

  describe('deleteByUserId', () => {
    it('should delete token by user ID', async () => {
      Token.destroy.mockResolvedValue(1);

      const result = await TokenRepository.deleteByUserId(1);

      expect(Token.destroy).toHaveBeenCalledWith({
        where: { userId: 1 }
      });
      expect(result).toBe(1);
    });

    it('should return 0 if no tokens deleted', async () => {
      Token.destroy.mockResolvedValue(0);

      const result = await TokenRepository.deleteByUserId(999);

      expect(result).toBe(0);
    });

    it('should throw ApiError on database error', async () => {
      Token.destroy.mockRejectedValue(new Error('Database error'));

      await expect(TokenRepository.deleteByUserId(1))
        .rejects.toThrow(ApiError);
    });
  });

  describe('deleteByRefreshToken', () => {
    it('should delete token by refresh token', async () => {
      Token.destroy.mockResolvedValue(1);

      const result = await TokenRepository.deleteByRefreshToken('test-token');

      expect(Token.destroy).toHaveBeenCalledWith({
        where: { refreshToken: 'test-token' }
      });
      expect(result).toBe(1);
    });

    it('should return 0 if no tokens deleted', async () => {
      Token.destroy.mockResolvedValue(0);

      const result = await TokenRepository.deleteByRefreshToken('non-existent');

      expect(result).toBe(0);
    });
  });

  describe('create', () => {
    it('should create new token', async () => {
      const tokenData = { refreshToken: 'new-token', userId: 1 };
      const mockToken = { id: 1, ...tokenData };
      Token.create.mockResolvedValue(mockToken);

      const result = await TokenRepository.create(tokenData);

      expect(Token.create).toHaveBeenCalledWith(tokenData);
      expect(result).toEqual(mockToken);
    });

    it('should throw ApiError on database error', async () => {
      Token.create.mockRejectedValue(new Error('Database error'));

      await expect(TokenRepository.create({ refreshToken: 'token', userId: 1 }))
        .rejects.toThrow(ApiError);
    });
  });
}); 