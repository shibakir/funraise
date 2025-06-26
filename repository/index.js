// Base repository providing common CRUD operations
const BaseRepository = require('./BaseRepository');

// User management repositories
const UserRepository = require('./UserRepository');
const AccountRepository = require('./AccountRepository');
const TokenRepository = require('./TokenRepository');

// Event management repositories
const EventRepository = require('./EventRepository');
const ParticipationRepository = require('./ParticipationRepository');
const EndConditionRepository = require('./EndConditionRepository');
const EventEndConditionRepository = require('./EventEndConditionRepository');

// Achievement system repositories
const AchievementRepository = require('./AchievementRepository');
const AchievementCriterionRepository = require('./AchievementCriterionRepository');
const UserAchievementRepository = require('./UserAchievementRepository');
const UserCriterionProgressRepository = require('./UserCriterionProgressRepository');

// Financial transaction repository
const TransactionRepository = require('./TransactionRepository');

/**
 * Repository exports
 * All repositories follow the singleton pattern and are exported as instances
 * ready for use by the service layer
 */
module.exports = {
    // Base repository for inheritance
    BaseRepository,
    
    // User and authentication repositories
    UserRepository,
    AccountRepository,
    TokenRepository,
    
    // Event and participation repositories
    EventRepository,
    ParticipationRepository,
    EndConditionRepository,
    EventEndConditionRepository,
    
    // Achievement and progress tracking repositories
    AchievementRepository,
    AchievementCriterionRepository,
    UserAchievementRepository,
    UserCriterionProgressRepository,
    
    // Financial transaction repository
    TransactionRepository,
}; 