const userService = require('./UserService');
const eventService = require('./EventService');
const eventEndConditionService = require('./EventEndConditionService');
const endConditionService = require('./EndConditionService');
const achievementService = require('./AchievementService');
const achievementCriterionService = require('./AchievementCriterionService');
const tokenService = require('./TokenService');
const transactionService = require('./TransactionService');
const accountService = require('./AccountService');

const userAchievementService = require('./UserAchievementService');
const userCriterionProgressService = require('./UserCriterionProgressService');
const participationService = require('./ParticipationService');

module.exports = {
    userService,
    eventService,
    EventService: eventService,
    eventEndConditionService,
    endConditionService,
    achievementService,
    achievementCriterionService,
    tokenService,
    transactionService,
    accountService,

    userAchievementService,
    userCriterionProgressService,
    participationService,
};