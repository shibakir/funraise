const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

exports.getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        //console.log('Search query:', search);
        
        let users;
        if (search) {
            users = await prismaClient.user.findMany({
                where: {
                    username: { contains: search }
                },
                select: { id: true, username: true, image: true }
            });
        } else {
            users = await prismaClient.user.findMany({
                select: { id: true, username: true, image: true }
            });
        }
        
        //console.log('Found users:', users);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Error getting users' });
    }
};  

exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prismaClient.user.findUnique({
            where: { id: parseInt(id) },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error getting user' });
    }
};

exports.createUser = async (req, res) => {
    const { email, name, password, image } = req.body;
    try {
        const newUser = await prismaClient.user.create({
            data: {
                email,
                name,
                password,
                image,
            },
        });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, name, password, image } = req.body;
    try {
        const updatedUser = await prismaClient.user.update({
            where: { id: parseInt(id) },
            data: {
                email,
                name,
                password,
                image,
            },
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Error updating user' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await prismaClient.user.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
};