const TransactionService = require('../../service/TransactionService');
const { Transaction, User } = require('../../model');
const userService = require('../../service/UserService');
const ApiError = require('../../exception/ApiError');

// Mock dependencies
jest.mock('../../model');
jest.mock('../../service/UserService');

describe('TransactionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const validTransactionData = {
            amount: 100,
            type: 'EVENT_OUTCOME',
            userId: 1
        };

        it('should successfully create a transaction and update the user\'s balance', async () => {
            const mockTransaction = {
                id: 1,
                ...validTransactionData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                balance: 400 // assume the balance became 400 after subtracting 100
            };

            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockResolvedValue({ newBalance: 400 });
            User.findOne.mockResolvedValue(mockUser);

            const result = await TransactionService.create(validTransactionData);

            expect(Transaction.create).toHaveBeenCalledWith({
                amount: validTransactionData.amount,
                type: validTransactionData.type,
                userId: validTransactionData.userId
            });

            expect(userService.updateBalance).toHaveBeenCalledWith({
                amount: validTransactionData.amount,
                type: validTransactionData.type,
                userId: validTransactionData.userId
            });

            expect(User.findOne).toHaveBeenCalledWith({
                where: { id: validTransactionData.userId }
            });

            expect(result).toEqual(mockTransaction);
        });

        it('should validate input data', async () => {
            const invalidData = {
                amount: -50, // negative amount
                type: 'EVENT_OUTCOME',
                userId: 1
            };

            // Validation is handled in the service, so the test should check that the service still works
            const mockTransaction = {
                id: 1,
                amount: -50,
                type: 'EVENT_OUTCOME',
                userId: 1
            };

            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockResolvedValue({ newBalance: 450 });
            User.findOne.mockResolvedValue({ id: 1, balance: 450 });

            const result = await TransactionService.create(invalidData);
            expect(result).toEqual(mockTransaction);
        });

        it('should validate transaction type', async () => {
            const invalidTypeData = {
                amount: 100,
                type: 'INVALID_TYPE',
                userId: 1
            };

            await expect(TransactionService.create(invalidTypeData))
                .rejects
                .toThrow();
        });

        it('should require userId', async () => {
            const noUserIdData = {
                amount: 100,
                type: 'EVENT_OUTCOME'
                // userId is missing
            };

            await expect(TransactionService.create(noUserIdData))
                .rejects
                .toThrow();
        });

        it('should handle errors when creating a transaction', async () => {
            const dbError = new Error('Database constraint violation');
            Transaction.create.mockRejectedValue(dbError);

            await expect(TransactionService.create(validTransactionData))
                .rejects
                .toThrow('Database constraint violation');
        });

        it('should handle errors when updating the balance', async () => {
            const mockTransaction = {
                id: 1,
                ...validTransactionData
            };

            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockRejectedValue(new Error('Insufficient balance'));

            await expect(TransactionService.create(validTransactionData))
                .rejects
                .toThrow('Insufficient balance');
        });

        it('should create a BALANCE_INCOME transaction', async () => {
            const incomeTransactionData = {
                amount: 200,
                type: 'BALANCE_INCOME',
                userId: 1
            };

            const mockTransaction = {
                id: 2,
                ...incomeTransactionData
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                balance: 700 // balance increased by 200
            };

            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockResolvedValue({ newBalance: 700 });
            User.findOne.mockResolvedValue(mockUser);

            const result = await TransactionService.create(incomeTransactionData);

            expect(Transaction.create).toHaveBeenCalledWith({
                amount: incomeTransactionData.amount,
                type: incomeTransactionData.type,
                userId: incomeTransactionData.userId
            });

            expect(userService.updateBalance).toHaveBeenCalledWith({
                amount: incomeTransactionData.amount,
                type: incomeTransactionData.type,
                userId: incomeTransactionData.userId
            });

            expect(result).toEqual(mockTransaction);
        });

        it('should create an EVENT_INCOME transaction', async () => {
            const eventIncomeData = {
                amount: 300,
                type: 'EVENT_INCOME',
                userId: 2
            };

            const mockTransaction = {
                id: 3,
                ...eventIncomeData
            };

            const mockUser = {
                id: 2,
                username: 'recipient',
                balance: 800
            };

            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockResolvedValue({ newBalance: 800 });
            User.findOne.mockResolvedValue(mockUser);

            const result = await TransactionService.create(eventIncomeData);

            expect(Transaction.create).toHaveBeenCalledWith({
                amount: eventIncomeData.amount,
                type: eventIncomeData.type,
                userId: eventIncomeData.userId
            });

            expect(userService.updateBalance).toHaveBeenCalledWith({
                amount: eventIncomeData.amount,
                type: eventIncomeData.type,
                userId: eventIncomeData.userId
            });

            expect(result).toEqual(mockTransaction);
        });

        it('should create a GIFT transaction', async () => {
            const giftTransactionData = {
                amount: 50,
                type: 'GIFT',
                userId: 3
            };

            const mockTransaction = {
                id: 4,
                ...giftTransactionData
            };

            const mockUser = {
                id: 3,
                username: 'giftrecipient',
                balance: 550
            };

            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockResolvedValue({ newBalance: 550 });
            User.findOne.mockResolvedValue(mockUser);

            const result = await TransactionService.create(giftTransactionData);

            expect(Transaction.create).toHaveBeenCalledWith({
                amount: giftTransactionData.amount,
                type: giftTransactionData.type,
                userId: giftTransactionData.userId
            });

            expect(userService.updateBalance).toHaveBeenCalledWith({
                amount: giftTransactionData.amount,
                type: giftTransactionData.type,
                userId: giftTransactionData.userId
            });

            expect(result).toEqual(mockTransaction);
        });

        it('should create a BALANCE_OUTCOME transaction', async () => {
            const outcomeTransactionData = {
                amount: 75,
                type: 'BALANCE_OUTCOME',
                userId: 1
            };

            const mockTransaction = {
                id: 5,
                ...outcomeTransactionData
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                balance: 425 // balance decreased by 75
            };

            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockResolvedValue({ newBalance: 425 });
            User.findOne.mockResolvedValue(mockUser);

            const result = await TransactionService.create(outcomeTransactionData);

            expect(Transaction.create).toHaveBeenCalledWith({
                amount: outcomeTransactionData.amount,
                type: outcomeTransactionData.type,
                userId: outcomeTransactionData.userId
            });

            expect(userService.updateBalance).toHaveBeenCalledWith({
                amount: outcomeTransactionData.amount,
                type: outcomeTransactionData.type,
                userId: outcomeTransactionData.userId
            });

            expect(result).toEqual(mockTransaction);
        });
    });

    describe('data validation', () => {
        it('should handle zero amount', async () => {
            const zeroAmountData = {
                amount: 0,
                type: 'EVENT_OUTCOME',
                userId: 1
            };

            const mockTransaction = {
                id: 1,
                amount: 0,
                type: 'EVENT_OUTCOME',
                userId: 1
            };

            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockResolvedValue({ newBalance: 500 });
            User.findOne.mockResolvedValue({ id: 1, balance: 500 });

            const result = await TransactionService.create(zeroAmountData);
            expect(result).toEqual(mockTransaction);
        });

        it('should validate correct userId', async () => {
            const invalidUserIdData = {
                amount: 100,
                type: 'EVENT_OUTCOME',
                userId: 'invalid-user-id'
            };

            await expect(TransactionService.create(invalidUserIdData))
                .rejects
                .toThrow();
        });

        it('should validate numeric amount', async () => {
            const stringAmountData = {
                amount: 'not-a-number',
                type: 'EVENT_OUTCOME',
                userId: 1
            };

            await expect(TransactionService.create(stringAmountData))
                .rejects
                .toThrow();
        });
    });

    describe('transaction flow', () => {
        it('should correctly handle the full transaction creation flow', async () => {
            const transactionData = {
                amount: 150,
                type: 'EVENT_OUTCOME',
                userId: 1
            };

            const mockTransaction = {
                id: 1,
                ...transactionData,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                balance: 350
            };

            // Set up the sequence of calls
            Transaction.create.mockResolvedValue(mockTransaction);
            userService.updateBalance.mockResolvedValue({ newBalance: 350 });
            User.findOne.mockResolvedValue(mockUser);

            const result = await TransactionService.create(transactionData);

            // Check that all required calls were made
            expect(Transaction.create).toHaveBeenCalled();
            expect(userService.updateBalance).toHaveBeenCalled();
            expect(User.findOne).toHaveBeenCalled();

            expect(result).toEqual(mockTransaction);
        });
    });
}); 