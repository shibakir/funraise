const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

exports.getAllParticipations = async (req, res) => {
    try {
        const participations = await prismaClient.participation.findMany({
            include: {
                user: true,
                event: true
            }
        });
        res.status(200).json(participations);
    } catch (error) {
        res.status(500).json({ error: 'Error getting participations' });
    }
};

exports.getParticipationById = async (req, res) => {
    const { id } = req.params;
    try {
        const participation = await prismaClient.participation.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: true,
                event: true
            }
        });
        if (!participation) {
            return res.status(404).json({ error: 'Participation not found' });
        }
        res.status(200).json(participation);
    } catch (error) {
        res.status(500).json({ error: 'Error getting participation' });
    }
};

exports.createParticipation = async (req, res) => {
    const { deposit, userId, eventId } = req.body;

    try {
        // Проверяем существование пользователя и события
        const [user, event] = await Promise.all([
            prismaClient.user.findUnique({ where: { id: parseInt(userId) } }),
            prismaClient.event.findUnique({ where: { id: parseInt(eventId) } })
        ]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Проверяем, не участвует ли уже пользователь в этом событии
        const existingParticipation = await prismaClient.participation.findFirst({
            where: {
                userId: parseInt(userId),
                eventId: parseInt(eventId)
            }
        });

        if (existingParticipation) {
            return res.status(400).json({ error: 'User already participates in this event' });
        }

        const newParticipation = await prismaClient.participation.create({
            data: {
                deposit: parseFloat(deposit),
                userId: parseInt(userId),
                eventId: parseInt(eventId)
            },
            include: {
                user: true,
                event: true
            }
        });

        // Обновляем сумму в банке события
        await prismaClient.event.update({
            where: { id: parseInt(eventId) },
            data: {
                bankAmount: {
                    increment: parseFloat(deposit)
                }
            }
        });

        res.status(201).json(newParticipation);
    } catch (error) {
        console.error('Error creating participation:', error);
        res.status(500).json({ error: 'Error creating participation' });
    }
};

exports.updateParticipation = async (req, res) => {
    const { id } = req.params;
    const { deposit } = req.body;

    try {
        const participation = await prismaClient.participation.findUnique({
            where: { id: parseInt(id) }
        });

        if (!participation) {
            return res.status(404).json({ error: 'Participation not found' });
        }

        const updatedParticipation = await prismaClient.participation.update({
            where: { id: parseInt(id) },
            data: {
                deposit: parseFloat(deposit)
            },
            include: {
                user: true,
                event: true
            }
        });

        // Обновляем сумму в банке события
        const depositDiff = parseFloat(deposit) - participation.deposit;
        await prismaClient.event.update({
            where: { id: participation.eventId },
            data: {
                bankAmount: {
                    increment: depositDiff
                }
            }
        });

        res.status(200).json(updatedParticipation);
    } catch (error) {
        console.error('Error updating participation:', error);
        res.status(500).json({ error: 'Error updating participation' });
    }
};

exports.deleteParticipation = async (req, res) => {
    const { id } = req.params;

    try {
        const participation = await prismaClient.participation.findUnique({
            where: { id: parseInt(id) }
        });

        if (!participation) {
            return res.status(404).json({ error: 'Participation not found' });
        }

        // Удаляем участие
        await prismaClient.participation.delete({
            where: { id: parseInt(id) }
        });

        // Обновляем сумму в банке события
        await prismaClient.event.update({
            where: { id: participation.eventId },
            data: {
                bankAmount: {
                    decrement: participation.deposit
                }
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting participation:', error);
        res.status(500).json({ error: 'Error deleting participation' });
    }
}; 