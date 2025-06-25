const eventResolvers = require('../../graphql/schema/resolvers/eventResolvers');
const { eventService, userService, participationService, eventEndConditionService } = require('../../service');
const { pubsub, SUBSCRIPTION_EVENTS } = require('../../graphql/pubsub');

describe('eventResolvers', () => {
  describe('Query.event', () => {
    it('should return an event by ID', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        description: 'Test Description',
        type: 'FUNDRAISING'
      };

      eventService.findById.mockResolvedValue(mockEvent);

      const result = await eventResolvers.Query.event(null, { id: 1 });

      expect(eventService.findById).toHaveBeenCalledWith(1, true);
      expect(result).toEqual(mockEvent);
    });

    it('should return null if the event is not found', async () => {
      eventService.findById.mockResolvedValue(null);

      const result = await eventResolvers.Query.event(null, { id: 999 });

      expect(result).toBeNull();
    });

    it('should return null if there is an error fetching the event', async () => {
      eventService.findById.mockRejectedValue(new Error('Database error'));

      const result = await eventResolvers.Query.event(null, { id: 1 });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error fetching event:', expect.any(Error));
    });
  });

  describe('Query.events', () => {
    it('should return all events', async () => {
      const mockEvents = [
        { id: 1, name: 'Event 1', type: 'FUNDRAISING' },
        { id: 2, name: 'Event 2', type: 'CHARITY' }
      ];

      eventService.findAll.mockResolvedValue(mockEvents);

      const result = await eventResolvers.Query.events();

      expect(eventService.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockEvents);
    });

    it('should return an empty array if there is an error fetching the events', async () => {
      eventService.findAll.mockRejectedValue(new Error('Database error'));

      const result = await eventResolvers.Query.events();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching events:', expect.any(Error));
    });
  });

  describe('Mutation.createEvent', () => {
    it('should successfully create an event', async () => {
      const mockInput = {
        name: 'New Event',
        description: 'New Description',
        type: 'FUNDRAISING',
        userId: 1,
        imageFile: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA',
        eventEndConditionGroups: []
      };

      const mockCreatedEvent = { id: 1, ...mockInput };
      const mockFullEvent = { ...mockCreatedEvent, endConditions: [] };

      eventService.create.mockResolvedValue(mockCreatedEvent);
      eventService.findById.mockResolvedValue(mockFullEvent);

      const result = await eventResolvers.Mutation.createEvent(null, { input: mockInput });

      expect(eventService.create).toHaveBeenCalledWith(mockInput);
      expect(eventService.findById).toHaveBeenCalledWith(1, true);
      expect(pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.EVENT_UPDATED, {
        eventUpdated: mockFullEvent
      });
      expect(result).toEqual(mockFullEvent);
    });

    it('should throw an error if the event creation fails', async () => {
      const mockInput = {
        name: 'Invalid Event',
        type: 'INVALID',
        userId: 1
      };

      eventService.create.mockRejectedValue(new Error('Validation error'));

      await expect(eventResolvers.Mutation.createEvent(null, { input: mockInput }))
        .rejects.toThrow('Validation error');

      expect(console.error).toHaveBeenCalledWith('Error creating event:', expect.any(Error));
    });
  });

  describe('Event field resolvers', () => {
    describe('Event.bankAmount', () => {
      it('should return the bank amount of the event', async () => {
        const mockEvent = { id: 1 };
        eventService.calculateBankAmount.mockResolvedValue(500);

        const result = await eventResolvers.Event.bankAmount(mockEvent);

        expect(eventService.calculateBankAmount).toHaveBeenCalledWith(1);
        expect(result).toBe(500);
      });

      it('should return 0 if there is an error calculating the bank amount', async () => {
        const mockEvent = { id: 1 };
        eventService.calculateBankAmount.mockRejectedValue(new Error('Database error'));

        const result = await eventResolvers.Event.bankAmount(mockEvent);

        expect(result).toBe(0);
        expect(console.error).toHaveBeenCalledWith('Error calculating bank amount:', expect.any(Error));
      });
    });

    describe('Event.endConditions', () => {
      it('should return the end conditions of the event', async () => {
        const mockEvent = { id: 1 };
        const mockEndConditions = [
          { id: 1, eventId: 1, type: 'TIME_BASED' },
          { id: 2, eventId: 1, type: 'AMOUNT_BASED' }
        ];

        eventEndConditionService.findByEventId.mockResolvedValue(mockEndConditions);

        const result = await eventResolvers.Event.endConditions(mockEvent);

        expect(eventEndConditionService.findByEventId).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockEndConditions);
      });

      it('should return an empty array if there is an error fetching the end conditions', async () => {
        const mockEvent = { id: 1 };
        eventEndConditionService.findByEventId.mockRejectedValue(new Error('Database error'));

        const result = await eventResolvers.Event.endConditions(mockEvent);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching end conditions:', expect.any(Error));
      });
    });

    describe('Event.creator', () => {
      it('should return the creator of the event', async () => {
        const mockEvent = { id: 1, userId: 123 };
        const mockCreator = { id: 123, username: 'creator' };

        userService.findById.mockResolvedValue(mockCreator);

        const result = await eventResolvers.Event.creator(mockEvent);

        expect(userService.findById).toHaveBeenCalledWith(123, false);
        expect(result).toEqual(mockCreator);
      });

      it('should return null if there is no userId', async () => {
        const mockEvent = { id: 1, userId: null };

        const result = await eventResolvers.Event.creator(mockEvent);

        expect(result).toBeNull();
        expect(userService.findById).not.toHaveBeenCalled();
      });

      it('should return null if there is an error fetching the event creator', async () => {
        const mockEvent = { id: 1, userId: 123 };
        userService.findById.mockRejectedValue(new Error('Database error'));

        const result = await eventResolvers.Event.creator(mockEvent);

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Error fetching event creator:', expect.any(Error));
      });
    });

    describe('Event.recipient', () => {
      it('should return the recipient of the event', async () => {
        const mockEvent = { id: 1, recipientId: 456 };
        const mockRecipient = { id: 456, username: 'recipient' };

        userService.findById.mockResolvedValue(mockRecipient);

        const result = await eventResolvers.Event.recipient(mockEvent);

        expect(userService.findById).toHaveBeenCalledWith(456, false);
        expect(result).toEqual(mockRecipient);
      });

      it('should return null if there is no recipientId', async () => {
        const mockEvent = { id: 1, recipientId: null };

        const result = await eventResolvers.Event.recipient(mockEvent);

        expect(result).toBeNull();
        expect(userService.findById).not.toHaveBeenCalled();
      });
    });

    describe('Event.participations', () => {
      it('should return the participations of the event', async () => {
        const mockEvent = { id: 1 };
        const mockParticipations = [
          { id: 1, userId: 1, eventId: 1, deposit: 100 },
          { id: 2, userId: 2, eventId: 1, deposit: 200 }
        ];

        participationService.findByEvent.mockResolvedValue(mockParticipations);

        const result = await eventResolvers.Event.participations(mockEvent);

        expect(participationService.findByEvent).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockParticipations);
      });

      it('should return an empty array if there is an error fetching the event participations', async () => {
        const mockEvent = { id: 1 };
        participationService.findByEvent.mockRejectedValue(new Error('Database error'));

        const result = await eventResolvers.Event.participations(mockEvent);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching event participations:', expect.any(Error));
      });
    });
  });

  describe('EventEndCondition field resolvers', () => {
    describe('EventEndCondition.conditions', () => {
      it('should return the conditions if they are already loaded', async () => {
        const mockEventEndCondition = {
          id: 1,
          conditions: [
            { id: 1, type: 'TIME_BASED', value: '2024-12-31' },
            { id: 2, type: 'AMOUNT_BASED', value: '1000' }
          ]
        };

        const result = await eventResolvers.EventEndCondition.conditions(mockEventEndCondition);

        expect(result).toEqual(mockEventEndCondition.conditions);
      });
    });
  });
}); 