const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('Event', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        bankAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
        status: {
            type: DataTypes.ENUM('IN_PROGRESS', 'FINISHED', 'FAILED'),
            defaultValue: 'IN_PROGRESS',
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        type: {
            type: DataTypes.ENUM('DONATION', 'FUNDRAISING', 'JACKPOT'),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        imageUrl: DataTypes.STRING,
        userId: DataTypes.INTEGER,
        recipientId: DataTypes.INTEGER
    }, {
        timestamps: true
    });

    Event.associate = models => {
        Event.belongsTo(models.User, { as: 'creator', foreignKey: 'userId' });
        Event.belongsTo(models.User, { as: 'recipient', foreignKey: 'recipientId' });
        Event.hasMany(models.Participation, { 
            foreignKey: 'eventId',
            as: 'participations'
        });
        Event.hasMany(models.EventEndCondition, { 
            foreignKey: 'eventId',
            as: 'endConditions'
        });
    };

    return Event;
};
