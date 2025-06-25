const TransactionRepository = require('../../repository/TransactionRepository');
const { Transaction } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  Transaction: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'Transaction'
  }
}));

describe('TransactionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should find transactions by user ID ordered by createdAt DESC', async () => {
      const mockTransactions = [
        { id: 1, userId: 1, amount: 100, type: 'deposit' },
        { id: 2, userId: 1, amount: -50, type: 'withdrawal' }
      ];
      Transaction.findAll.mockResolvedValue(mockTransactions);

      const result = await TransactionRepository.findByUserId(1);

      expect(Transaction.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: [['createdAt', 'DESC']]
      });
      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array if no transactions found', async () => {
      Transaction.findAll.mockResolvedValue([]);

      const result = await TransactionRepository.findByUserId(999);

      expect(result).toEqual([]);
    });

    it('should throw ApiError on database error', async () => {
      Transaction.findAll.mockRejectedValue(new Error('Database error'));

      await expect(TransactionRepository.findByUserId(1))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByType', () => {
    it('should find transactions by type', async () => {
      const mockTransactions = [
        { id: 1, userId: 1, amount: 100, type: 'deposit' },
        { id: 2, userId: 2, amount: 150, type: 'deposit' }
      ];
      Transaction.findAll.mockResolvedValue(mockTransactions);

      const result = await TransactionRepository.findByType('deposit');

      expect(Transaction.findAll).toHaveBeenCalledWith({
        where: { type: 'deposit' }
      });
      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array if no transactions found', async () => {
      Transaction.findAll.mockResolvedValue([]);

      const result = await TransactionRepository.findByType('non-existent-type');

      expect(result).toEqual([]);
    });
  });

  describe('findByUserIdAndType', () => {
    it('should find transactions by user ID and type', async () => {
      const mockTransactions = [
        { id: 1, userId: 1, amount: 100, type: 'deposit' }
      ];
      Transaction.findAll.mockResolvedValue(mockTransactions);

      const result = await TransactionRepository.findByUserIdAndType(1, 'deposit');

      expect(Transaction.findAll).toHaveBeenCalledWith({
        where: { userId: 1, type: 'deposit' }
      });
      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array if no transactions found', async () => {
      Transaction.findAll.mockResolvedValue([]);

      const result = await TransactionRepository.findByUserIdAndType(999, 'deposit');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create new transaction', async () => {
      const transactionData = { userId: 1, amount: 100, type: 'deposit' };
      const mockTransaction = { id: 1, ...transactionData };
      Transaction.create.mockResolvedValue(mockTransaction);

      const result = await TransactionRepository.create(transactionData);

      expect(Transaction.create).toHaveBeenCalledWith(transactionData);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw ApiError on database error', async () => {
      Transaction.create.mockRejectedValue(new Error('Database error'));

      await expect(TransactionRepository.create({ userId: 1, amount: 100, type: 'deposit' }))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByPk', () => {
    it('should find transaction by primary key', async () => {
      const mockTransaction = { id: 1, userId: 1, amount: 100, type: 'deposit' };
      Transaction.findByPk.mockResolvedValue(mockTransaction);

      const result = await TransactionRepository.findByPk(1);

      expect(Transaction.findByPk).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(mockTransaction);
    });

    it('should throw ApiError if transaction not found', async () => {
      Transaction.findByPk.mockResolvedValue(null);

      await expect(TransactionRepository.findByPk(999))
        .rejects.toThrow(ApiError);
    });
  });
}); 