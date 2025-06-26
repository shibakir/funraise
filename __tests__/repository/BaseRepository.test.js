const BaseRepository = require('../../repository/BaseRepository');
const ApiError = require('../../exception/ApiError');

// Mock model for testing
const mockModel = {
    name: 'TestModel',
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn()
};

describe('BaseRepository', () => {
    let repository;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new BaseRepository(mockModel);
    });

    describe('constructor', () => {
        it('should initialize with model', () => {
            expect(repository.model).toBe(mockModel);
        });
    });

    describe('create', () => {
        it('should successfully create a record', async () => {
            const testData = { name: 'Test', value: 123 };
            const mockCreatedRecord = { id: 1, ...testData };
            
            mockModel.create.mockResolvedValue(mockCreatedRecord);

            const result = await repository.create(testData);

            expect(mockModel.create).toHaveBeenCalledWith(testData);
            expect(result).toEqual(mockCreatedRecord);
        });

        it('should throw ApiError on database error', async () => {
            const testData = { name: 'Test' };
            const dbError = new Error('Database constraint violation');
            
            mockModel.create.mockRejectedValue(dbError);

            await expect(repository.create(testData))
                .rejects
                .toThrow(ApiError);

            try {
                await repository.create(testData);
            } catch (error) {
                expect(error.message).toContain('Error creating TestModel');
            }
        });
    });

    describe('findByPk', () => {
        it('should find record by primary key', async () => {
            const mockRecord = { id: 1, name: 'Test' };
            const options = { include: ['associations'] };
            
            mockModel.findByPk.mockResolvedValue(mockRecord);

            const result = await repository.findByPk(1, options);

            expect(mockModel.findByPk).toHaveBeenCalledWith(1, options);
            expect(result).toEqual(mockRecord);
        });

        it('should throw ApiError when record not found', async () => {
            mockModel.findByPk.mockResolvedValue(null);

            await expect(repository.findByPk(999))
                .rejects
                .toThrow(ApiError);

            try {
                await repository.findByPk(999);
            } catch (error) {
                expect(error.message).toBe('TestModel not found');
            }
        });

        it('should throw ApiError on database error', async () => {
            const dbError = new Error('Database connection error');
            mockModel.findByPk.mockRejectedValue(dbError);

            await expect(repository.findByPk(1))
                .rejects
                .toThrow(ApiError);

            try {
                await repository.findByPk(1);
            } catch (error) {
                expect(error.message).toContain('Error finding TestModel by ID');
            }
        });

        it('should re-throw ApiError without wrapping', async () => {
            const apiError = ApiError.notFound('Custom not found message');
            mockModel.findByPk.mockRejectedValue(apiError);

            await expect(repository.findByPk(1))
                .rejects
                .toThrow('Custom not found message');
        });
    });

    describe('findOne', () => {
        it('should find one record with options', async () => {
            const mockRecord = { id: 1, name: 'Test' };
            const options = { where: { name: 'Test' } };
            
            mockModel.findOne.mockResolvedValue(mockRecord);

            const result = await repository.findOne(options);

            expect(mockModel.findOne).toHaveBeenCalledWith(options);
            expect(result).toEqual(mockRecord);
        });

        it('should return null when no record found', async () => {
            mockModel.findOne.mockResolvedValue(null);

            const result = await repository.findOne({ where: { id: 999 } });

            expect(result).toBeNull();
        });

        it('should throw ApiError on database error', async () => {
            const dbError = new Error('Database error');
            mockModel.findOne.mockRejectedValue(dbError);

            await expect(repository.findOne({}))
                .rejects
                .toThrow(ApiError);

            try {
                await repository.findOne({});
            } catch (error) {
                expect(error.message).toContain('Error finding TestModel');
            }
        });
    });

    describe('findAll', () => {
        it('should find all records', async () => {
            const mockRecords = [
                { id: 1, name: 'Test1' },
                { id: 2, name: 'Test2' }
            ];
            const options = { limit: 10 };
            
            mockModel.findAll.mockResolvedValue(mockRecords);

            const result = await repository.findAll(options);

            expect(mockModel.findAll).toHaveBeenCalledWith(options);
            expect(result).toEqual(mockRecords);
        });

        it('should return empty array when no records found', async () => {
            mockModel.findAll.mockResolvedValue([]);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });

        it('should throw ApiError on database error', async () => {
            const dbError = new Error('Database error');
            mockModel.findAll.mockRejectedValue(dbError);

            await expect(repository.findAll())
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('update', () => {
        it('should update record successfully', async () => {
            const updateData = { name: 'Updated' };
            const updateResult = [1]; // Sequelize returns array with number of affected rows
            
            mockModel.update.mockResolvedValue(updateResult);

            const result = await repository.update(1, updateData);

            expect(mockModel.update).toHaveBeenCalledWith(updateData, {
                where: { id: 1 }
            });
            expect(result).toEqual(updateResult);
        });

        it('should throw ApiError when no records updated', async () => {
            const updateData = { name: 'Updated' };
            mockModel.update.mockResolvedValue([0]); // No records affected

            await expect(repository.update(999, updateData))
                .rejects
                .toThrow(ApiError);

            try {
                await repository.update(999, updateData);
            } catch (error) {
                expect(error.message).toBe('TestModel not found');
            }
        });

        it('should handle custom options', async () => {
            const updateData = { name: 'Updated' };
            const options = { returning: true };
            const updateResult = [1];
            
            mockModel.update.mockResolvedValue(updateResult);

            await repository.update(1, updateData, options);

            expect(mockModel.update).toHaveBeenCalledWith(updateData, {
                where: { id: 1 },
                returning: true
            });
        });

        it('should re-throw ApiError without wrapping', async () => {
            const updateData = { name: 'Updated' };
            const apiError = ApiError.validation('Validation failed');
            mockModel.update.mockRejectedValue(apiError);

            await expect(repository.update(1, updateData))
                .rejects
                .toThrow('Validation failed');
        });

        it('should throw ApiError on database error', async () => {
            const updateData = { name: 'Updated' };
            const dbError = new Error('Database error');
            mockModel.update.mockRejectedValue(dbError);

            await expect(repository.update(1, updateData))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('updateWhere', () => {
        it('should update records with where clause', async () => {
            const updateData = { status: 'active' };
            const whereClause = { type: 'test' };
            const updateResult = [2]; // Two records updated
            
            mockModel.update.mockResolvedValue(updateResult);

            const result = await repository.updateWhere(updateData, whereClause);

            expect(mockModel.update).toHaveBeenCalledWith(updateData, {
                where: whereClause
            });
            expect(result).toEqual(updateResult);
        });

        it('should handle custom options in updateWhere', async () => {
            const updateData = { status: 'active' };
            const whereClause = { type: 'test' };
            const options = { returning: true };
            const updateResult = [1];
            
            mockModel.update.mockResolvedValue(updateResult);

            await repository.updateWhere(updateData, whereClause, options);

            expect(mockModel.update).toHaveBeenCalledWith(updateData, {
                where: whereClause,
                returning: true
            });
        });

        it('should throw ApiError on database error in updateWhere', async () => {
            const updateData = { status: 'active' };
            const whereClause = { type: 'test' };
            const dbError = new Error('Database error');
            mockModel.update.mockRejectedValue(dbError);

            await expect(repository.updateWhere(updateData, whereClause))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('destroy', () => {
        it('should delete record successfully', async () => {
            mockModel.destroy.mockResolvedValue(1); // One record deleted

            const result = await repository.destroy(1);

            expect(mockModel.destroy).toHaveBeenCalledWith({
                where: { id: 1 }
            });
            expect(result).toBe(1);
        });

        it('should throw ApiError when no records deleted', async () => {
            mockModel.destroy.mockResolvedValue(0); // No records deleted

            await expect(repository.destroy(999))
                .rejects
                .toThrow(ApiError);

            try {
                await repository.destroy(999);
            } catch (error) {
                expect(error.message).toBe('TestModel not found');
            }
        });

        it('should handle custom options in destroy', async () => {
            const options = { force: true };
            mockModel.destroy.mockResolvedValue(1);

            await repository.destroy(1, options);

            expect(mockModel.destroy).toHaveBeenCalledWith({
                where: { id: 1 },
                force: true
            });
        });

        it('should re-throw ApiError without wrapping', async () => {
            const apiError = ApiError.forbidden('Access denied');
            mockModel.destroy.mockRejectedValue(apiError);

            await expect(repository.destroy(1))
                .rejects
                .toThrow('Access denied');
        });

        it('should throw ApiError on database error', async () => {
            const dbError = new Error('Database error');
            mockModel.destroy.mockRejectedValue(dbError);

            await expect(repository.destroy(1))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('destroyWhere', () => {
        it('should delete records with where clause', async () => {
            const whereClause = { status: 'inactive' };
            mockModel.destroy.mockResolvedValue(3); // Three records deleted

            const result = await repository.destroyWhere(whereClause);

            expect(mockModel.destroy).toHaveBeenCalledWith({
                where: whereClause
            });
            expect(result).toBe(3);
        });

        it('should handle custom options in destroyWhere', async () => {
            const whereClause = { status: 'inactive' };
            const options = { force: true };
            mockModel.destroy.mockResolvedValue(2);

            await repository.destroyWhere(whereClause, options);

            expect(mockModel.destroy).toHaveBeenCalledWith({
                where: whereClause,
                force: true
            });
        });

        it('should throw ApiError on database error in destroyWhere', async () => {
            const whereClause = { status: 'inactive' };
            const dbError = new Error('Database error');
            mockModel.destroy.mockRejectedValue(dbError);

            await expect(repository.destroyWhere(whereClause))
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('count', () => {
        it('should return count of records', async () => {
            const options = { where: { status: 'active' } };
            mockModel.count.mockResolvedValue(5);

            const result = await repository.count(options);

            expect(mockModel.count).toHaveBeenCalledWith(options);
            expect(result).toBe(5);
        });

        it('should return zero when no records match', async () => {
            mockModel.count.mockResolvedValue(0);

            const result = await repository.count();

            expect(result).toBe(0);
        });

        it('should throw ApiError on database error', async () => {
            const dbError = new Error('Database error');
            mockModel.count.mockRejectedValue(dbError);

            await expect(repository.count())
                .rejects
                .toThrow(ApiError);
        });
    });

    describe('exists', () => {
        it('should return true when records exist', async () => {
            const whereClause = { email: 'test@example.com' };
            mockModel.count.mockResolvedValue(1);

            const result = await repository.exists(whereClause);

            expect(mockModel.count).toHaveBeenCalledWith({ where: whereClause });
            expect(result).toBe(true);
        });

        it('should return false when no records exist', async () => {
            const whereClause = { email: 'nonexistent@example.com' };
            mockModel.count.mockResolvedValue(0);

            const result = await repository.exists(whereClause);

            expect(result).toBe(false);
        });

        it('should return true when multiple records exist', async () => {
            const whereClause = { status: 'active' };
            mockModel.count.mockResolvedValue(5);

            const result = await repository.exists(whereClause);

            expect(result).toBe(true);
        });

        it('should throw ApiError on database error', async () => {
            const whereClause = { email: 'test@example.com' };
            const dbError = new Error('Database error');
            mockModel.count.mockRejectedValue(dbError);

            await expect(repository.exists(whereClause))
                .rejects
                .toThrow(ApiError);
        });
    });
}); 
