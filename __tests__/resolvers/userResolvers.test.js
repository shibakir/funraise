const userResolvers = require('../../graphql/schema/resolvers/userResolvers');
const { userService, participationService } = require('../../service');

// Add mocks for new userService methods
userService.getUsersByBalance = jest.fn();
userService.getUsersByEventIncome = jest.fn();
userService.getUsersByEventOutcome = jest.fn();

describe('userResolvers', () => {
  describe('Query.user', () => {
    it('should return a user by ID', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        balance: 1000
      };

      userService.findById.mockResolvedValue(mockUser);

      const result = await userResolvers.Query.user(null, { id: 1 });

      expect(userService.findById).toHaveBeenCalledWith(1, true);
      expect(result).toEqual(mockUser);
    });

    it('should return null if the user is not found', async () => {
      userService.findById.mockResolvedValue(null);

      const result = await userResolvers.Query.user(null, { id: 999 });

      expect(result).toBeNull();
    });

    it('should return null if there is an error fetching the user', async () => {
      userService.findById.mockRejectedValue(new Error('Database error'));

      const result = await userResolvers.Query.user(null, { id: 1 });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error fetching user:', expect.any(Error));
    });
  });

  describe('Query.users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com' },
        { id: 2, username: 'user2', email: 'user2@example.com' }
      ];

      userService.findAll.mockResolvedValue(mockUsers);

      const result = await userResolvers.Query.users();

      expect(userService.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockUsers);
    });

    it('should return an empty array if there is an error fetching the users', async () => {
      userService.findAll.mockRejectedValue(new Error('Database error'));

      const result = await userResolvers.Query.users();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching users:', expect.any(Error));
    });
  });

      describe('Query.searchUsers', () => {
        it('should find users by username', async () => {
            const mockUsers = [
                { id: 1, username: 'testuser1', email: 'test1@example.com' },
                { id: 2, username: 'testuser2', email: 'test2@example.com' }
            ];

            userService.searchByUsername.mockResolvedValue(mockUsers);

            const result = await userResolvers.Query.searchUsers(null, { username: 'test' });

            expect(userService.searchByUsername).toHaveBeenCalledWith('test', true);
            expect(result).toEqual(mockUsers);
        });

        it('should return an empty array if there is an error searching for users', async () => {
            userService.searchByUsername.mockRejectedValue(new Error('Database error'));

            const result = await userResolvers.Query.searchUsers(null, { username: 'test' });

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Error searching users:', expect.any(Error));
        });
    });

    describe('Query.usersByBalance', () => {
        it('should return users ranked by balance with limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 1000 },
                { id: 2, username: 'user2', amount: 500 }
            ];

            userService.getUsersByBalance.mockResolvedValue(mockRankings);

            const result = await userResolvers.Query.usersByBalance(null, { limit: 10 });

            expect(userService.getUsersByBalance).toHaveBeenCalledWith(10);
            expect(result).toEqual(mockRankings);
        });

        it('should return users ranked by balance without limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 1000 },
                { id: 2, username: 'user2', amount: 500 },
                { id: 3, username: 'user3', amount: 100 }
            ];

            userService.getUsersByBalance.mockResolvedValue(mockRankings);

            const result = await userResolvers.Query.usersByBalance(null, {});

            expect(userService.getUsersByBalance).toHaveBeenCalledWith(undefined);
            expect(result).toEqual(mockRankings);
        });

        it('should return an empty array if there is an error fetching users by balance', async () => {
            userService.getUsersByBalance.mockRejectedValue(new Error('Database error'));

            const result = await userResolvers.Query.usersByBalance(null, { limit: 10 });

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Error fetching users by balance:', expect.any(Error));
        });
    });

    describe('Query.usersByEventIncome', () => {
        const afterDate = '2024-01-01T00:00:00.000Z';

        it('should return users ranked by event income with afterDate and limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 500.50 },
                { id: 2, username: 'user2', amount: 200.25 }
            ];

            userService.getUsersByEventIncome.mockResolvedValue(mockRankings);

            const result = await userResolvers.Query.usersByEventIncome(null, { afterDate, limit: 5 });

            expect(userService.getUsersByEventIncome).toHaveBeenCalledWith(afterDate, 5);
            expect(result).toEqual(mockRankings);
        });

        it('should return users ranked by event income without afterDate', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 300.75 }
            ];

            userService.getUsersByEventIncome.mockResolvedValue(mockRankings);

            const result = await userResolvers.Query.usersByEventIncome(null, { limit: 10 });

            expect(userService.getUsersByEventIncome).toHaveBeenCalledWith(undefined, 10);
            expect(result).toEqual(mockRankings);
        });

        it('should return users ranked by event income without limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 300.75 }
            ];

            userService.getUsersByEventIncome.mockResolvedValue(mockRankings);

            const result = await userResolvers.Query.usersByEventIncome(null, { afterDate });

            expect(userService.getUsersByEventIncome).toHaveBeenCalledWith(afterDate, undefined);
            expect(result).toEqual(mockRankings);
        });

        it('should return an empty array if there is an error fetching users by event income', async () => {
            userService.getUsersByEventIncome.mockRejectedValue(new Error('Database error'));

            const result = await userResolvers.Query.usersByEventIncome(null, { afterDate, limit: 5 });

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Error fetching users by event income:', expect.any(Error));
        });
    });

    describe('Query.usersByEventOutcome', () => {
        const afterDate = '2024-01-01T00:00:00.000Z';

        it('should return users ranked by event outcome with afterDate and limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 400.00 },
                { id: 2, username: 'user2', amount: 150.75 }
            ];

            userService.getUsersByEventOutcome.mockResolvedValue(mockRankings);

            const result = await userResolvers.Query.usersByEventOutcome(null, { afterDate, limit: 8 });

            expect(userService.getUsersByEventOutcome).toHaveBeenCalledWith(afterDate, 8);
            expect(result).toEqual(mockRankings);
        });

        it('should return users ranked by event outcome without afterDate', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 250.50 }
            ];

            userService.getUsersByEventOutcome.mockResolvedValue(mockRankings);

            const result = await userResolvers.Query.usersByEventOutcome(null, { limit: 3 });

            expect(userService.getUsersByEventOutcome).toHaveBeenCalledWith(undefined, 3);
            expect(result).toEqual(mockRankings);
        });

        it('should return users ranked by event outcome without limit', async () => {
            const mockRankings = [
                { id: 1, username: 'user1', amount: 200.25 }
            ];

            userService.getUsersByEventOutcome.mockResolvedValue(mockRankings);

            const result = await userResolvers.Query.usersByEventOutcome(null, { afterDate });

            expect(userService.getUsersByEventOutcome).toHaveBeenCalledWith(afterDate, undefined);
            expect(result).toEqual(mockRankings);
        });

        it('should return an empty array if there is an error fetching users by event outcome', async () => {
            userService.getUsersByEventOutcome.mockRejectedValue(new Error('Database error'));

            const result = await userResolvers.Query.usersByEventOutcome(null, { afterDate, limit: 5 });

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Error fetching users by event outcome:', expect.any(Error));
        });
    });

  describe('Mutation.updateUser', () => {
    it('should successfully update the user', async () => {
      const mockInput = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com'
      };

      userService.update.mockResolvedValue(mockUpdatedUser);

      const result = await userResolvers.Mutation.updateUser(null, { id: 1, input: mockInput });

      expect(userService.update).toHaveBeenCalledWith(1, mockInput);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw an error if the user update fails', async () => {
      const mockInput = {
        username: 'existinguser'
      };

      userService.update.mockRejectedValue(new Error('Username already exists'));

      await expect(userResolvers.Mutation.updateUser(null, { id: 1, input: mockInput }))
        .rejects.toThrow('Username already exists');

      expect(console.error).toHaveBeenCalledWith('Error updating user:', expect.any(Error));
    });

    it('should throw a general error if there is no specific message', async () => {
      const mockInput = {
        username: 'testuser'
      };

      userService.update.mockRejectedValue(new Error());

      await expect(userResolvers.Mutation.updateUser(null, { id: 1, input: mockInput }))
        .rejects.toThrow('Failed to update user');
    });
  });

  describe('User field resolvers', () => {
    describe('User.events', () => {
      it('should return all events of the user (created and received)', async () => {
        const mockUser = {
          id: 1,
          getCreatedEvents: jest.fn().mockResolvedValue([
            { id: 1, name: 'Created Event 1' },
            { id: 2, name: 'Created Event 2' }
          ]),
          getReceivedEvents: jest.fn().mockResolvedValue([
            { id: 3, name: 'Received Event 1' }
          ])
        };

        const result = await userResolvers.User.events(mockUser);

        expect(mockUser.getCreatedEvents).toHaveBeenCalled();
        expect(mockUser.getReceivedEvents).toHaveBeenCalled();
        expect(result).toEqual([
          { id: 1, name: 'Created Event 1' },
          { id: 2, name: 'Created Event 2' },
          { id: 3, name: 'Received Event 1' }
        ]);
      });

      it('should return an empty array if there is an error fetching the user events', async () => {
        const mockUser = {
          id: 1,
          getCreatedEvents: jest.fn().mockRejectedValue(new Error('Database error')),
          getReceivedEvents: jest.fn()
        };

        const result = await userResolvers.User.events(mockUser);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching user events:', expect.any(Error));
      });
    });

    describe('User.createdEvents', () => {
      it('should return the created events of the user', async () => {
        const mockUser = {
          id: 1,
          getCreatedEvents: jest.fn().mockResolvedValue([
            { id: 1, name: 'Created Event 1' },
            { id: 2, name: 'Created Event 2' }
          ])
        };

        const result = await userResolvers.User.createdEvents(mockUser);

        expect(mockUser.getCreatedEvents).toHaveBeenCalled();
        expect(result).toEqual([
          { id: 1, name: 'Created Event 1' },
          { id: 2, name: 'Created Event 2' }
        ]);
      });

      it('should return an empty array if there is an error fetching the user created events', async () => {
        const mockUser = {
          id: 1,
          getCreatedEvents: jest.fn().mockRejectedValue(new Error('Database error'))
        };

        const result = await userResolvers.User.createdEvents(mockUser);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching user created events:', expect.any(Error));
      });
    });

    describe('User.receivedEvents', () => {
      it('should return the received events of the user', async () => {
        const mockUser = {
          id: 1,
          getReceivedEvents: jest.fn().mockResolvedValue([
            { id: 3, name: 'Received Event 1' },
            { id: 4, name: 'Received Event 2' }
          ])
        };

        const result = await userResolvers.User.receivedEvents(mockUser);

        expect(mockUser.getReceivedEvents).toHaveBeenCalled();
        expect(result).toEqual([
          { id: 3, name: 'Received Event 1' },
          { id: 4, name: 'Received Event 2' }
        ]);
      });

      it('should return an empty array if there is an error fetching the user received events', async () => {
        const mockUser = {
          id: 1,
          getReceivedEvents: jest.fn().mockRejectedValue(new Error('Database error'))
        };

        const result = await userResolvers.User.receivedEvents(mockUser);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching user received events:', expect.any(Error));
      });
    });

    describe('User.participations', () => {
      it('should return the participations of the user', async () => {
        const mockUser = { id: 1 };
        const mockParticipations = [
          { id: 1, userId: 1, eventId: 1, deposit: 100 },
          { id: 2, userId: 1, eventId: 2, deposit: 200 }
        ];

        participationService.findByUser.mockResolvedValue(mockParticipations);

        const result = await userResolvers.User.participations(mockUser);

        expect(participationService.findByUser).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockParticipations);
      });

      it('should return an empty array if there is an error fetching the user participations', async () => {
        const mockUser = { id: 1 };
        participationService.findByUser.mockRejectedValue(new Error('Database error'));

        const result = await userResolvers.User.participations(mockUser);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching user participations:', expect.any(Error));
      });
    });

    describe('User.accounts', () => {
      it('should return the accounts of the user', async () => {
        const mockUser = { id: 1 };
        const mockAccounts = [
          { id: 1, userId: 1, provider: 'discord', providerUsername: 'discorduser' },
          { id: 2, userId: 1, provider: 'google', providerUsername: 'googleuser' }
        ];

        userService.findAccounts.mockResolvedValue(mockAccounts);

        const result = await userResolvers.User.accounts(mockUser);

        expect(userService.findAccounts).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockAccounts);
      });

      it('should return an empty array if there is an error fetching the user accounts', async () => {
        const mockUser = { id: 1 };
        userService.findAccounts.mockRejectedValue(new Error('Database error'));

        const result = await userResolvers.User.accounts(mockUser);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching user accounts:', expect.any(Error));
      });
    });
  });
}); 