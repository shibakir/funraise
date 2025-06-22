const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const Achievement = sequelize.define('Achievement', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: DataTypes.STRING,
        //description: DataTypes.STRING,
        iconUrl: DataTypes.STRING,
    }, {
        timestamps: true
    });

    Achievement.associate = models => {
        Achievement.hasMany(models.AchievementCriterion, { 
            foreignKey: 'achievementId',
            as: 'criteria'
        });
        Achievement.hasMany(models.UserAchievement, { 
            foreignKey: 'achievementId',
            as: 'userAchievements'
        });
    };

    return Achievement;
};
