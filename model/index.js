const { sequelize, testConnection } = require('./db');
const { DataTypes } = require('sequelize');

const Account = require('./Account')(sequelize, DataTypes);
const Achievement = require('./Achievement')(sequelize, DataTypes);
const AchievementCriterion = require('./AchievementCriterion')(sequelize, DataTypes);
const EndCondition = require('./EndCondition')(sequelize, DataTypes);
const Event = require('./Event')(sequelize, DataTypes);
const EventEndCondition = require('./EventEndCondition')(sequelize, DataTypes);
const Participation = require('./Participation')(sequelize, DataTypes);
const Token = require('./Token')(sequelize, DataTypes);
const Transaction = require('./Transaction')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);
const UserAchievement = require('./UserAchievement')(sequelize, DataTypes);
const UserCriterionProgress = require('./UserCriterionProgress')(sequelize, DataTypes);

const models = {
    Account,
    Achievement,
    AchievementCriterion,
    EndCondition,
    Event,
    EventEndCondition,
    Participation,
    Token,
    Transaction,
    User,
    UserAchievement,
    UserCriterionProgress,
};

Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

const syncDatabase = async () => {
    try {
        await testConnection();
        await sequelize.sync({ force: false });
        console.log('Db synced');
    } catch (error) {
        console.error('Error syncing db:', error);
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    ...models,
};