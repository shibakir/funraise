const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const AchievementCriterion = sequelize.define('AchievementCriterion', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        achievementId: DataTypes.INTEGER,

        type: DataTypes.ENUM(
            'EVENT_BANK_COMPLETED', // participate in event with some bank completed after
            'EVENT_PEOPLE_COMPLETED', // participate in event with some number of participants completed after
            'EVENT_TIME_COMPLETED', // participate in event with some date condition completed after

            'EVENT_INCOME_ONETIME', // get some amount after event complete
            'EVENT_INCOME_ALL', // achieve some summary amount from all completed events

            'EVENT_COUNT_ALL', // participate in some count of events ( both created and participated)
            'EVENT_COUNT_CREATED', // create some count of events
            'EVENT_COUNT_COMPLETED', // participate in some count of events completed after

            'USER_ACTIVITY', // achieve some activity day streak on user account
            'USER_BANK' // achieve some bank amount on user account
        ),
        value: DataTypes.INTEGER,

    }, {
        timestamps: true
    });

    AchievementCriterion.associate = models => {
        AchievementCriterion.belongsTo(models.Achievement, { 
            foreignKey: 'achievementId',
            as: 'achievement'
        });
        AchievementCriterion.hasMany(models.UserCriterionProgress, { 
            foreignKey: 'criterionId',
            as: 'userProgresses'
        });
    };

    return AchievementCriterion;
};
