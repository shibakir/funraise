const EndConditionRepository = require('../../repository/EndConditionRepository');
const { EndCondition } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  EndCondition: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'EndCondition'
  }
}));

describe('EndConditionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEventEndCondition', () => {
    it('should find end conditions by event end condition ID', async () => {
      const mockEndConditions = [
        {
          id: 1,
          endConditionId: 1,
          name: 'time',
          operator: '>=',
          value: '2024-12-31T23:59:59Z',
          isCompleted: false
        },
        {
          id: 2,
          endConditionId: 1,
          name: 'participant_count',
          operator: '>=',
          value: '10',
          isCompleted: false
        }
      ];
      EndCondition.findAll.mockResolvedValue(mockEndConditions);

      const result = await EndConditionRepository.findByEventEndCondition(1);

      expect(EndCondition.findAll).toHaveBeenCalledWith({
        where: { endConditionId: 1 }
      });
      expect(result).toEqual(mockEndConditions);
    });

    it('should return empty array if no conditions found', async () => {
      EndCondition.findAll.mockResolvedValue([]);

      const result = await EndConditionRepository.findByEventEndCondition(999);

      expect(result).toEqual([]);
    });

    it('should throw ApiError on database error', async () => {
      EndCondition.findAll.mockRejectedValue(new Error('Database error'));

      await expect(EndConditionRepository.findByEventEndCondition(1))
        .rejects.toThrow(ApiError);
    });
  });

  describe('updateCompletion', () => {
    it('should update completion status to true', async () => {
      EndCondition.update.mockResolvedValue([1]);

      const result = await EndConditionRepository.updateCompletion(1, true);

      expect(EndCondition.update).toHaveBeenCalledWith(
        { isCompleted: true },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should update completion status to false', async () => {
      EndCondition.update.mockResolvedValue([1]);

      const result = await EndConditionRepository.updateCompletion(1, false);

      expect(EndCondition.update).toHaveBeenCalledWith(
        { isCompleted: false },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should throw ApiError if end condition not found', async () => {
      EndCondition.update.mockResolvedValue([0]);

      await expect(EndConditionRepository.updateCompletion(999, true))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError on database error', async () => {
      EndCondition.update.mockRejectedValue(new Error('Database error'));

      await expect(EndConditionRepository.updateCompletion(1, true))
        .rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    it('should create new end condition', async () => {
      const endConditionData = {
        endConditionId: 1,
        name: 'time',
        operator: '>=',
        value: '2024-12-31T23:59:59Z',
        isCompleted: false
      };
      const mockEndCondition = { id: 1, ...endConditionData };
      EndCondition.create.mockResolvedValue(mockEndCondition);

      const result = await EndConditionRepository.create(endConditionData);

      expect(EndCondition.create).toHaveBeenCalledWith(endConditionData);
      expect(result).toEqual(mockEndCondition);
    });

    it('should throw ApiError on database error', async () => {
      EndCondition.create.mockRejectedValue(new Error('Database error'));

      await expect(EndConditionRepository.create({
        name: 'time',
        operator: '>='
      })).rejects.toThrow(ApiError);
    });
  });

  describe('findByPk', () => {
    it('should find end condition by primary key', async () => {
      const mockEndCondition = {
        id: 1,
        name: 'time',
        operator: '>=',
        value: '2024-12-31T23:59:59Z',
        isCompleted: false
      };
      EndCondition.findByPk.mockResolvedValue(mockEndCondition);

      const result = await EndConditionRepository.findByPk(1);

      expect(EndCondition.findByPk).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(mockEndCondition);
    });

    it('should throw ApiError if end condition not found', async () => {
      EndCondition.findByPk.mockResolvedValue(null);

      await expect(EndConditionRepository.findByPk(999))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findAll', () => {
    it('should find all end conditions', async () => {
      const mockEndConditions = [
        { id: 1, name: 'time', isCompleted: false },
        { id: 2, name: 'participant_count', isCompleted: true }
      ];
      EndCondition.findAll.mockResolvedValue(mockEndConditions);

      const result = await EndConditionRepository.findAll();

      expect(EndCondition.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockEndConditions);
    });
  });

  describe('destroy', () => {
    it('should delete end condition', async () => {
      EndCondition.destroy.mockResolvedValue(1);

      const result = await EndConditionRepository.destroy(1);

      expect(EndCondition.destroy).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(result).toBe(1);
    });

    it('should throw ApiError if end condition not found', async () => {
      EndCondition.destroy.mockResolvedValue(0);

      await expect(EndConditionRepository.destroy(999))
        .rejects.toThrow(ApiError);
    });
  });
}); 