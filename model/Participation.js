const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const Participation = sequelize.define('Participation', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        deposit: DataTypes.FLOAT,
        userId: DataTypes.INTEGER,
        eventId: DataTypes.INTEGER
    }, {
        timestamps: true
    });

    Participation.associate = models => {
        Participation.belongsTo(models.User, { 
            foreignKey: 'userId',
            as: 'user'
        });
        Participation.belongsTo(models.Event, { 
            foreignKey: 'eventId',
            as: 'event'
        });
    };

    return Participation;
};
