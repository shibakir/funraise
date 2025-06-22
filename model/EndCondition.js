const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const EndCondition = sequelize.define('EndCondition', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        endConditionId: DataTypes.INTEGER,
        name: {
            type: DataTypes.ENUM('TIME', 'BANK', 'PARTICIPATION'),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        operator: {
            type: DataTypes.ENUM('EQUALS', 'GREATER', 'LESS', 'GREATER_EQUALS', 'LESS_EQUALS'),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        value: { 
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        timestamps: true
    });

    EndCondition.associate = models => {
        EndCondition.belongsTo(models.EventEndCondition, { 
            foreignKey: 'endConditionId', 
            onDelete: 'CASCADE',
            as: 'eventEndCondition'
        });
    };

    return EndCondition;
};
