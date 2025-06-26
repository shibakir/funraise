const EventEndConditionRepository = require('../../repository/EventEndConditionRepository');
const { EventEndCondition, EndCondition } = require('../../model');
const ApiError = require('../../exception/ApiError');

// Mock model
jest.mock('../../model', () => ({
  EventEndCondition: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'EventEndCondition'
  },
  EndCondition: {}
}));

describe('EventEndConditionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEventWithConditions', () => {
    it('should find event end conditions with associated conditions', async () => {
      const mockEventEndConditions = [
        {
          id: 1,
          eventId: 1,
          groupType: 'AND',
          isCompleted: false,
          isFailed: false,
          conditions: [
            {
              id: 1,
              name: 'time',
              operator: '>=',
              value: '2024-12-31T23:59:59Z',
              isCompleted: false
            },
            {
              id: 2,
              name: 'participant_count',
              operator: '>=',
              value: '10',
              isCompleted: false
            }
          ]
        }
      ];
      EventEndCondition.findAll.mockResolvedValue(mockEventEndConditions);

      const result = await EventEndConditionRepository.findByEventWithConditions(1);

      expect(EventEndCondition.findAll).toHaveBeenCalledWith({
        where: { eventId: 1 },
        include: [{
          model: EndCondition,
          as: 'conditions'
        }]
      });
      expect(result).toEqual(mockEventEndConditions);
    });

    it('should return empty array if no conditions found', async () => {
      EventEndCondition.findAll.mockResolvedValue([]);

      const result = await EventEndConditionRepository.findByEventWithConditions(999);

      expect(result).toEqual([]);
    });

    it('should throw ApiError on database error', async () => {
      EventEndCondition.findAll.mockRejectedValue(new Error('Database error'));

      await expect(EventEndConditionRepository.findByEventWithConditions(1))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findByEventId', () => {
    it('should find event end conditions by event ID with conditions', async () => {
      const mockEventEndConditions = [
        {
          id: 1,
          eventId: 1,
          groupType: 'OR',
          conditions: [
            { id: 1, name: 'time', isCompleted: true }
          ]
        }
      ];
      EventEndCondition.findAll.mockResolvedValue(mockEventEndConditions);

      const result = await EventEndConditionRepository.findByEventId(1);

      expect(EventEndCondition.findAll).toHaveBeenCalledWith({
        where: { eventId: 1 },
        include: [{
          model: EndCondition,
          as: 'conditions'
        }]
      });
      expect(result).toEqual(mockEventEndConditions);
    });
  });

  describe('updateCompletion', () => {
    it('should update completion status to true', async () => {
      EventEndCondition.update.mockResolvedValue([1]);

      const result = await EventEndConditionRepository.updateCompletion(1, true);

      expect(EventEndCondition.update).toHaveBeenCalledWith(
        { isCompleted: true },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should update completion status to false', async () => {
      EventEndCondition.update.mockResolvedValue([1]);

      const result = await EventEndConditionRepository.updateCompletion(1, false);

      expect(EventEndCondition.update).toHaveBeenCalledWith(
        { isCompleted: false },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should throw ApiError if event end condition not found', async () => {
      EventEndCondition.update.mockResolvedValue([0]);

      await expect(EventEndConditionRepository.updateCompletion(999, true))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError on database error', async () => {
      EventEndCondition.update.mockRejectedValue(new Error('Database error'));

      await expect(EventEndConditionRepository.updateCompletion(1, true))
        .rejects.toThrow(ApiError);
    });
  });

  describe('updateFailure', () => {
    it('should update failure status to true', async () => {
      EventEndCondition.update.mockResolvedValue([1]);

      const result = await EventEndConditionRepository.updateFailure(1, true);

      expect(EventEndCondition.update).toHaveBeenCalledWith(
        { isFailed: true },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should update failure status to false', async () => {
      EventEndCondition.update.mockResolvedValue([1]);

      const result = await EventEndConditionRepository.updateFailure(1, false);

      expect(EventEndCondition.update).toHaveBeenCalledWith(
        { isFailed: false },
        { where: { id: 1 } }
      );
      expect(result).toEqual([1]);
    });

    it('should throw ApiError if event end condition not found', async () => {
      EventEndCondition.update.mockResolvedValue([0]);

      await expect(EventEndConditionRepository.updateFailure(999, true))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError on database error', async () => {
      EventEndCondition.update.mockRejectedValue(new Error('Database error'));

      await expect(EventEndConditionRepository.updateFailure(1, true))
        .rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    it('should create new event end condition', async () => {
      const eventEndConditionData = {
        eventId: 1,
        groupType: 'AND',
        isCompleted: false,
        isFailed: false
      };
      const mockEventEndCondition = { id: 1, ...eventEndConditionData };
      EventEndCondition.create.mockResolvedValue(mockEventEndCondition);

      const result = await EventEndConditionRepository.create(eventEndConditionData);

      expect(EventEndCondition.create).toHaveBeenCalledWith(eventEndConditionData);
      expect(result).toEqual(mockEventEndCondition);
    });

    it('should throw ApiError on database error', async () => {
      EventEndCondition.create.mockRejectedValue(new Error('Database error'));

      await expect(EventEndConditionRepository.create({
        eventId: 1,
        groupType: 'AND'
      })).rejects.toThrow(ApiError);
    });
  });

  describe('findByPk', () => {
    it('should find event end condition by primary key', async () => {
      const mockEventEndCondition = {
        id: 1,
        eventId: 1,
        groupType: 'AND',
        isCompleted: false,
        isFailed: false
      };
      EventEndCondition.findByPk.mockResolvedValue(mockEventEndCondition);

      const result = await EventEndConditionRepository.findByPk(1);

      expect(EventEndCondition.findByPk).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(mockEventEndCondition);
    });

    it('should throw ApiError if event end condition not found', async () => {
      EventEndCondition.findByPk.mockResolvedValue(null);

      await expect(EventEndConditionRepository.findByPk(999))
        .rejects.toThrow(ApiError);
    });
  });

  describe('findAll', () => {
    it('should find all event end conditions', async () => {
      const mockEventEndConditions = [
        { id: 1, eventId: 1, groupType: 'AND' },
        { id: 2, eventId: 2, groupType: 'OR' }
      ];
      EventEndCondition.findAll.mockResolvedValue(mockEventEndConditions);

      const result = await EventEndConditionRepository.findAll();

      expect(EventEndCondition.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockEventEndConditions);
    });
  });

  describe('destroy', () => {
    it('should delete event end condition', async () => {
      EventEndCondition.destroy.mockResolvedValue(1);

      const result = await EventEndConditionRepository.destroy(1);

      expect(EventEndCondition.destroy).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(result).toBe(1);
    });

    it('should throw ApiError if event end condition not found', async () => {
      EventEndCondition.destroy.mockResolvedValue(0);

      await expect(EventEndConditionRepository.destroy(999))
        .rejects.toThrow(ApiError);
    });
  });
}); 