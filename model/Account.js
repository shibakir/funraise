const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define('Account', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.INTEGER },
        type: DataTypes.STRING,
        provider: DataTypes.STRING,
        providerAccountId: DataTypes.STRING,
        refresh_token: DataTypes.STRING,
        access_token: DataTypes.STRING,
        expires_at: DataTypes.INTEGER,
        token_type: DataTypes.STRING,
        scope: DataTypes.STRING,
        session_state: DataTypes.STRING,
        // Discord-specific fields
        providerUsername: DataTypes.STRING, // Discord username
        providerAvatar: DataTypes.STRING,   // Discord avatar URL
        providerEmail: DataTypes.STRING,    // Discord email
        providerDiscriminator: DataTypes.STRING, // Discord discriminator (#1234)
    }, {
        timestamps: true,
        indexes: [{ unique: true, fields: ['provider', 'providerAccountId'] }]
    });

    Account.associate = models => {
        Account.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
    };

    return Account;
};

