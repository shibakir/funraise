const BaseRepository = require('./BaseRepository');
const { User, Account } = require('../model');
const { Op } = require('sequelize');

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async findByEmail(email) {
        return await this.findOne({
            where: { email }
        });
    }

    async findByUsername(username) {
        return await this.findOne({
            where: { username }
        });
    }

    async findByActivationLink(activationLink) {
        return await this.findOne({
            where: { activationLink }
        });
    }

    async findByEmailOrUsername(email, username) {
        return await this.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { username }
                ]
            }
        });
    }

    async searchByUsername(username, includeAssociations = true) {
        const includeOptions = includeAssociations ? [
            { association: 'createdEvents' },
            { association: 'receivedEvents' }
        ] : [];

        return await this.findAll({
            where: {
                username: {
                    [Op.like]: `%${username}%`
                }
            },
            include: includeOptions
        });
    }

    async findByIdWithAssociations(userId, includeAssociations = true) {
        const includeOptions = includeAssociations ? [
            { association: 'createdEvents' },
            { association: 'receivedEvents' },
            { model: Account }
        ] : [];

        return await this.findByPk(userId, {
            include: includeOptions
        });
    }

    async findByIdWithBalance(userId) {
        return await this.findByPk(userId, {
            attributes: ['id', 'balance']
        });
    }

    async findAllWithAssociations(includeAssociations = true) {
        const includeOptions = includeAssociations ? [
            { association: 'createdEvents' },
            { association: 'receivedEvents' }
        ] : [];

        return await this.findAll({
            include: includeOptions
        });
    }

    async findAllMinimal() {
        return await this.findAll({
            attributes: ['id']
        });
    }

    async updateBalance(userId, newBalance) {
        return await this.update(userId, { balance: newBalance });
    }

    async activate(userId) {
        return await this.update(userId, {
            isActivated: true,
            activationLink: null
        });
    }

    async updateActivationLink(userId, activationLink) {
        return await this.update(userId, { activationLink });
    }
}

module.exports = new UserRepository(); 
