const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        amount: DataTypes.FLOAT,
        type: DataTypes.ENUM('BALANCE_INCOME', 'BALANCE_OUTCOME', 'EVENT_INCOME', 'EVENT_OUTCOME', 'GIFT'),
        userId: DataTypes.INTEGER,
    }, {
        timestamps: true
    });

    Transaction.associate = models => {
        Transaction.belongsTo(models.User, { foreignKey: 'userId' });
    };

    return Transaction;
};