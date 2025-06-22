const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const UserCriterionProgress = sequelize.define('UserCriterionProgress', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userAchievementId: DataTypes.INTEGER,
        criterionId: DataTypes.INTEGER,
        currentValue: { type: DataTypes.INTEGER, defaultValue: 0 },
        completed: { type: DataTypes.BOOLEAN, defaultValue: false },
        completedAt: DataTypes.DATE
    }, {
        timestamps: true,
        indexes: [{ unique: true, fields: ['userAchievementId', 'criterionId'] }]
    });

    UserCriterionProgress.associate = models => {
        UserCriterionProgress.belongsTo(models.UserAchievement, { 
            foreignKey: 'userAchievementId', 
            onDelete: 'CASCADE',
            as: 'userAchievement'
        });
        UserCriterionProgress.belongsTo(models.AchievementCriterion, { 
            foreignKey: 'criterionId',
            as: 'criterion'
        });
    };

    return UserCriterionProgress;
};
