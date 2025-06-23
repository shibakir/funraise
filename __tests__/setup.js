// global configuration for tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// mock GraphQL modules
jest.mock('../graphql/pubsub', () => ({
  pubsub: {
    publish: jest.fn(),
    asyncIterator: jest.fn()
  },
  SUBSCRIPTION_EVENTS: {
    EVENT_UPDATED: 'EVENT_UPDATED',
    PARTICIPATION_CREATED: 'PARTICIPATION_CREATED',
    PARTICIPATION_UPDATED: 'PARTICIPATION_UPDATED',
    BALANCE_UPDATED: 'BALANCE_UPDATED',
    EVENT_CONDITIONS_UPDATED: 'EVENT_CONDITIONS_UPDATED'
  }
}));

// mock services
jest.mock('../service', () => ({
  userService: {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    findByIdWithAccountsOnly: jest.fn(),
    searchByUsername: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    verifyPassword: jest.fn(),
    activate: jest.fn(),
    resendActivationEmail: jest.fn(),
    findAccounts: jest.fn()
  },
  achievementService: {
    findById: jest.fn()
  },
  userAchievementService: {
    findByUserWithDetails: jest.fn()
  },
  userCriterionProgressService: {
    findByUserAchievementWithCriteria: jest.fn()
  },
  achievementCriterionService: {
    findById: jest.fn()
  },
  eventService: {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    calculateBankAmount: jest.fn()
  },
  participationService: {
    findByUserAndEvent: jest.fn(),
    findByEvent: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  transactionService: {
    create: jest.fn()
  },
  tokenService: {
    saveToken: jest.fn(),
    findToken: jest.fn(),
    removeToken: jest.fn()
  },
  accountService: {
    findByProviderAndAccountId: jest.fn(),
    findByUserAndProvider: jest.fn(),
    updateByProviderAndAccountId: jest.fn(),
    create: jest.fn()
  },
  eventEndConditionService: {
    findByEventId: jest.fn()
  },
  endConditionService: {
    findByEventEndCondition: jest.fn()
  }
}));

// mock JWT utils
jest.mock('../utils/jwtUtils', () => ({
  generateToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyToken: jest.fn(),
  verifyRefreshToken: jest.fn()
}));

// mock axios
jest.mock('axios');

// mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'bW9jay1yYW5kb20tcGFzc3dvcmQxMjM=')
  }))
}));

// mock EventConditionTracker
jest.mock('../utils/eventCondition', () => ({
  onParticipationUpdated: jest.fn().mockResolvedValue(),
  onParticipationAdded: jest.fn().mockResolvedValue(),
  onEventCreated: jest.fn().mockResolvedValue(),
  onTimeCheck: jest.fn().mockResolvedValue()
}));

// mock Achievement utils
jest.mock('../utils/achievement', () => ({
  onEventCreated: jest.fn().mockResolvedValue(),
  onEventCompleted: jest.fn().mockResolvedValue(),
  onEventParticipated: jest.fn().mockResolvedValue(),
  onUserActivityUpdated: jest.fn().mockResolvedValue(),
  onUserBankUpdated: jest.fn().mockResolvedValue(),
  initializeUser: jest.fn().mockResolvedValue(),
  getUserAchievements: jest.fn().mockResolvedValue()
}));

beforeEach(() => {
  jest.clearAllMocks();
}); 
