const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        email: { type: DataTypes.STRING, unique: true, allowNull: false },
        username: { type: DataTypes.STRING, unique: true, allowNull: false },
        password: { type: DataTypes.STRING },
        balance: { type: DataTypes.FLOAT, defaultValue: 0 },
        image: { type: DataTypes.STRING },
        isActivated: { type: DataTypes.BOOLEAN, defaultValue: false },
        activationLink: { type: DataTypes.STRING, unique: true },
    }, {
        timestamps: true
    });

    User.associate = models => {
        User.hasMany(models.Account, { foreignKey: 'userId' });
        User.hasMany(models.Transaction, { foreignKey: 'userId' });
        User.hasMany(models.Event, { as: 'createdEvents', foreignKey: 'userId' });
        User.hasMany(models.Event, { as: 'receivedEvents', foreignKey: 'recipientId' });
        User.hasMany(models.Participation, { foreignKey: 'userId' });
        User.hasMany(models.UserAchievement, { foreignKey: 'userId' });
    };

    return User;
};
