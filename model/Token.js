const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define('Token', {
        userId: { type: DataTypes.INTEGER, primaryKey: true },
        refreshToken: { type: DataTypes.STRING, unique: true },
    }, {
        timestamps: true
    });

    Token.associate = models => {
        Token.belongsTo(models.User, { foreignKey: 'userId' });
    };

    return Token;
};
