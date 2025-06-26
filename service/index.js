/**
 * Service layer exports for the application
 * This file serves as the central export point for all service classes,
 * providing a clean interface for resolver and controller imports
 * Services contain business logic and coordinate between repositories, utilities, and external services
 */

// Core service imports
const userService = require('./UserService');
const eventService = require('./EventService');
const eventEndConditionService = require('./EventEndConditionService');
const endConditionService = require('./EndConditionService');
const achievementService = require('./AchievementService');
const achievementCriterionService = require('./AchievementCriterionService');
const tokenService = require('./TokenService');
const transactionService = require('./TransactionService');
const accountService = require('./AccountService');

// User tracking and progress services
const userAchievementService = require('./UserAchievementService');
const userCriterionProgressService = require('./UserCriterionProgressService');
const participationService = require('./ParticipationService');

/**
 * Centralized service exports
 * All services follow the singleton pattern and are exported as instances
 * ready for use by GraphQL resolvers and other application layers
 */
module.exports = {
    // Core user and authentication services
    userService,
    accountService,
    tokenService,
    
    // Event management and lifecycle services
    eventService,
    EventService: eventService, // 
    eventEndConditionService,
    endConditionService,
    participationService,
    
    // Achievement system services
    achievementService,
    achievementCriterionService,
    tokenService,
    transactionService,
    accountService,

    userAchievementService,
    userCriterionProgressService,
    participationService,
    
    // Financial transaction services
    transactionService,
};