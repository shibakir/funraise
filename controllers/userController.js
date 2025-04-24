const userService = require('../services/userService');
const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

exports.getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const users = await userService.getAllUsers({ search });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Error getting users' });
    }
};  

exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await userService.getUserById(id);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: 'Error getting user' });
    }
};

exports.getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Проверяем права доступа: только владелец аккаунта или админ могут видеть транзакции
       // if (parseInt(userId) !== req.user.id) {
       //     return res.status(403).json({ message: 'Access denied. Not your transactions.' });
       // }
        
        // Получаем транзакции пользователя
        const transactions = await prismaClient.transaction.findMany({
            where: { userId: parseInt(userId) },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error getting user transactions:', error);
        res.status(500).json({ error: 'Error getting user transactions' });
    }
};

exports.getUserBalance = async (req, res) => {
    const { userId } = req.params;

    //if (parseInt(userId) !== req.user.id) {
    //    return res.status(403).json({ message: 'Access denied. Not your transactions.' });
    //}

    try {
        const balance = await userService.getUserBalance(userId);
        res.status(200).json(balance);
    } catch (error) {
        console.error('Error getting user balance:', error);
        res.status(500).json({ error: 'Error getting user balance' });
    }
};

exports.createUser = async (req, res) => {
    const userData = req.body;
    try {
        const newUser = await userService.createUser(userData);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const userData = req.body;
    try {
        const updatedUser = await userService.updateUser(id, userData);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Error updating user' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await userService.deleteUser(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
};