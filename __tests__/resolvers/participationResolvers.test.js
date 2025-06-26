const participationResolvers = require('../../graphql/schema/resolvers/participationResolvers');
const { participationService, transactionService, userService, eventService } = require('../../service');
const { pubsub, SUBSCRIPTION_EVENTS } = require('../../graphql/pubsub');
const eventConditions = require('../../utils/eventCondition');

describe('participationResolvers', () => {
  describe('Query.userParticipation', () => {
    it('should return the participation of the user in the event', async () => {
      const mockParticipation = {
        id: 1,
        userId: 1,
        eventId: 1,
        deposit: 100
      };

      participationService.findByUserAndEvent.mockResolvedValue(mockParticipation);

      const result = await participationResolvers.Query.userParticipation(null, { userId: 1, eventId: 1 });

      expect(participationService.findByUserAndEvent).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockParticipation);
    });

    it('should return null if the user participation is not found', async () => {
      participationService.findByUserAndEvent.mockResolvedValue(null);

      const result = await participationResolvers.Query.userParticipation(null, { userId: 1, eventId: 999 });

      expect(result).toBeNull();
    });

    it('should return null if there is an error fetching the user participation', async () => {
      participationService.findByUserAndEvent.mockRejectedValue(new Error('Database error'));

      const result = await participationResolvers.Query.userParticipation(null, { userId: 1, eventId: 1 });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error fetching user participation:', expect.any(Error));
    });
  });

  describe('Query.userBalance', () => {
    it('should return the balance of the user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        balance: 1500
      };

      userService.findById.mockResolvedValue(mockUser);

      const result = await participationResolvers.Query.userBalance(null, { userId: 1 });

      expect(userService.findById).toHaveBeenCalledWith(1, false);
      expect(result).toBe(1500);
    });

    it('should return 0 if the user is not found', async () => {
      userService.findById.mockResolvedValue(null);

      const result = await participationResolvers.Query.userBalance(null, { userId: 999 });

      expect(result).toBe(0);
    });

    it('should return 0 if there is an error fetching the user balance', async () => {
      userService.findById.mockRejectedValue(new Error('Database error'));

      const result = await participationResolvers.Query.userBalance(null, { userId: 1 });

      expect(result).toBe(0);
      expect(console.error).toHaveBeenCalledWith('Error fetching user balance:', expect.any(Error));
    });
  });

  describe('Mutation.createTransaction', () => {
    it('should successfully create a transaction', async () => {
      const mockInput = {
        amount: 500,
        type: 'BALANCE_INCOME',
        userId: 1
      };

      const mockTransaction = {
        id: 1,
        amount: 500,
        type: 'BALANCE_INCOME',
        userId: 1,
        createdAt: new Date()
      };

      transactionService.create.mockResolvedValue(mockTransaction);

      const result = await participationResolvers.Mutation.createTransaction(null, { input: mockInput });

      expect(transactionService.create).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw an error if the transaction creation fails', async () => {
      const mockInput = {
        amount: 500,
        type: 'INVALID_TYPE',
        userId: 1
      };

      transactionService.create.mockRejectedValue(new Error('Validation error: \"type\" must be one of [BALANCE_INCOME, BALANCE_OUTCOME, EVENT_INCOME, EVENT_OUTCOME, GIFT]'));

      await expect(participationResolvers.Mutation.createTransaction(null, { input: mockInput }))
        .rejects.toThrow('Validation error: \"type\" must be one of [BALANCE_INCOME, BALANCE_OUTCOME, EVENT_INCOME, EVENT_OUTCOME, GIFT]');

      expect(console.error).toHaveBeenCalledWith('Error creating transaction:', expect.any(Error));
    });
  });

  describe('Mutation.upsertParticipation', () => {
    describe('when the participation already exists', () => {
      it('should update the existing participation', async () => {
        const mockInput = {
          userId: 1,
          eventId: 1,
          deposit: 200
        };

        const mockExistingParticipation = {
          id: 1,
          userId: 1,
          eventId: 1,
          deposit: 300
        };

        const mockUpdatedParticipation = {
          id: 1,
          userId: 1,
          eventId: 1,
          deposit: 500
        };

        const mockTransaction = {
          id: 1,
          amount: 200,
          type: 'EVENT_OUTCOME',
          userId: 1
        };

        participationService.findByUserAndEvent.mockResolvedValue(mockExistingParticipation);
        participationService.update.mockResolvedValue(mockUpdatedParticipation);
        transactionService.create.mockResolvedValue(mockTransaction);

        const result = await participationResolvers.Mutation.upsertParticipation(null, { input: mockInput });

        expect(participationService.findByUserAndEvent).toHaveBeenCalledWith(1, 1);
        expect(participationService.update).toHaveBeenCalledWith(1, { deposit: 500 });
        expect(transactionService.create).toHaveBeenCalledWith({
          amount: 200,
          type: 'EVENT_OUTCOME',
          userId: 1
        });
        expect(eventConditions.onParticipationUpdated).toHaveBeenCalledWith(1, 1, 500);

        expect(pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.PARTICIPATION_UPDATED, {
          participationUpdated: { id: 1, eventId: 1 }
        });
        expect(pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.EVENT_UPDATED, {
          eventUpdated: { id: 1 }
        });
        expect(pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.BALANCE_UPDATED, {
          balanceUpdated: { id: 1 }
        });

        expect(result).toEqual({
          participation: mockUpdatedParticipation,
          isNewParticipation: false,
          transaction: mockTransaction
        });
      });
    });

    describe('when the participation does not exist', () => {
      it('should create a new participation', async () => {
        const mockInput = {
          userId: 1,
          eventId: 1,
          deposit: 100
        };

        const mockNewParticipation = {
          id: 2,
          userId: 1,
          eventId: 1,
          deposit: 100
        };

        const mockTransaction = {
          id: 2,
          amount: 100,
          type: 'EVENT_OUTCOME',
          userId: 1
        };

        participationService.findByUserAndEvent.mockResolvedValue(null);
        participationService.create.mockResolvedValue(mockNewParticipation);
        participationService.findById.mockResolvedValue(mockNewParticipation);
        transactionService.create.mockResolvedValue(mockTransaction);

        const result = await participationResolvers.Mutation.upsertParticipation(null, { input: mockInput });

        expect(participationService.create).toHaveBeenCalledWith({
          userId: 1,
          eventId: 1,
          deposit: 100
        });
        expect(participationService.findById).toHaveBeenCalledWith(2);

        expect(pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.PARTICIPATION_CREATED, {
          participationCreated: { id: 2, eventId: 1 }
        });

        expect(result).toEqual({
          participation: mockNewParticipation,
          isNewParticipation: true,
          transaction: mockTransaction
        });
      });
    });

    it('should throw an error if the participation creation/update fails', async () => {
      const mockInput = {
        userId: 1,
        eventId: 1,
        deposit: 100
      };

      participationService.findByUserAndEvent.mockRejectedValue(new Error('Database error'));

      await expect(participationResolvers.Mutation.upsertParticipation(null, { input: mockInput }))
        .rejects.toThrow('Database error');

      expect(console.error).toHaveBeenCalledWith('Error upserting participation:', expect.any(Error));
    });
  });

  describe('Participation field resolvers', () => {
    describe('Participation.user', () => {
      it('should return the user if they are already loaded', async () => {
        const mockParticipation = {
          id: 1,
          userId: 1,
          user: { id: 1, username: 'testuser' }
        };

        const result = await participationResolvers.Participation.user(mockParticipation);

        expect(result).toEqual(mockParticipation.user);
        expect(userService.findById).not.toHaveBeenCalled();
      });

      it('should load the user if they are not loaded', async () => {
        const mockParticipation = {
          id: 1,
          userId: 1
        };

        const mockUser = { id: 1, username: 'testuser' };

        userService.findById.mockResolvedValue(mockUser);

        const result = await participationResolvers.Participation.user(mockParticipation);

        expect(userService.findById).toHaveBeenCalledWith(1, false);
        expect(result).toEqual(mockUser);
      });

      it('should return null if there is an error fetching the participation user', async () => {
        const mockParticipation = {
          id: 1,
          userId: 1
        };

        userService.findById.mockRejectedValue(new Error('Database error'));

        const result = await participationResolvers.Participation.user(mockParticipation);

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Error fetching participation user:', expect.any(Error));
      });
    });

    describe('Participation.event', () => {
      it('should return the event if it is already loaded', async () => {
        const mockParticipation = {
          id: 1,
          eventId: 1,
          event: { id: 1, name: 'Test Event' }
        };

        const result = await participationResolvers.Participation.event(mockParticipation);

        expect(result).toEqual(mockParticipation.event);
        expect(eventService.findById).not.toHaveBeenCalled();
      });

      it('should load the event if it is not loaded', async () => {
        const mockParticipation = {
          id: 1,
          eventId: 1
        };

        const mockEvent = { id: 1, name: 'Test Event' };

        eventService.findById.mockResolvedValue(mockEvent);

        const result = await participationResolvers.Participation.event(mockParticipation);

        expect(eventService.findById).toHaveBeenCalledWith(1, false);
        expect(result).toEqual(mockEvent);
      });

      it('should return null if there is an error fetching the participation event', async () => {
        const mockParticipation = {
          id: 1,
          eventId: 1
        };

        eventService.findById.mockRejectedValue(new Error('Database error'));

        const result = await participationResolvers.Participation.event(mockParticipation);

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Error fetching participation event:', expect.any(Error));
      });
    });
  });
}); 