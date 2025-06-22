const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const EventEndCondition = sequelize.define('EventEndCondition', {
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        eventId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        isCompleted: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: false 
        },
        isFailed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: true,
    });

    EventEndCondition.associate = models => {
        EventEndCondition.belongsTo(models.Event, { 
            foreignKey: 'eventId', 
            onDelete: 'CASCADE',
            as: 'event'
        });
        EventEndCondition.hasMany(models.EndCondition, { 
            foreignKey: 'endConditionId',
            as: 'conditions'
        });
    };

    return EventEndCondition;
};
