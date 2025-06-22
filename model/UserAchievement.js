const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const UserAchievement = sequelize.define('UserAchievement', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: DataTypes.INTEGER,
        achievementId: DataTypes.INTEGER,
        status: { type: DataTypes.BOOLEAN, defaultValue: false },
        unlockedAt: DataTypes.DATE
    }, {
        timestamps: true,
        indexes: [{ unique: true, fields: ['userId', 'achievementId'] }]
    });

    UserAchievement.associate = models => {
        UserAchievement.belongsTo(models.User, { 
            foreignKey: 'userId', 
            onDelete: 'CASCADE',
            as: 'user'
        });
        UserAchievement.belongsTo(models.Achievement, { 
            foreignKey: 'achievementId',
            as: 'achievement'
        });
        UserAchievement.hasMany(models.UserCriterionProgress, { 
            foreignKey: 'userAchievementId',
            as: 'progresses'
        });
    };

    return UserAchievement;
};
