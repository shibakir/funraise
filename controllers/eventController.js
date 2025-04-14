const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();

exports.getAllEvents = async (req, res) => {
    try {
        const events = await prismaClient.event.findMany();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: 'Error getting events' });
    }
};

exports.getEventById = async (req, res) => {
    const { id } = req.params;
    try {
        const event = await prismaClient.event.findUnique({
            where: { id: parseInt(id) },
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Error getting event' });
    }
};

exports.createEvent = async (req, res) => {
    const { name, description, status, type, recipientId, endConditions } = req.body;

    const userId = 1;
    //const userId = req.user.id; // Получаем ID пользователя из токена JWT

    try {
        // Валидация
        if ((type === 'DONATION' || type === 'FUNDRAISING') && !recipientId) {
            return res.status(400).json({ 
                error: 'For types DONATION and FUNDRAISING, you must specify the recipient of the funds (recipientId)' 
            });
        }
        if (!endConditions || !Array.isArray(endConditions) || endConditions.length === 0) {
            return res.status(400).json({
                error: 'You must specify at least one event end condition'
            });
        }

        const eventData = {
            name,
            description,
            status,
            type,
            userId
        };

        if (type === 'DONATION' || type === 'FUNDRAISING') {
            eventData.recipientId = parseInt(recipientId);
        }

        // Запуск транзакции
        const result = await prismaClient.$transaction(async (prisma) => {
            const createdEvent = await prisma.event.create({
                data: eventData,
            });

            const createdEndConditions = await prisma.eventEndCondition.createMany({
                data: endConditions.map(() => ({
                    eventId: createdEvent.id
                })),
                //skipDuplicates: false
            });

            // Нужно получить их ID (поскольку createMany не возвращает id)
            const endConditionsFromDb = await prisma.eventEndCondition.findMany({
                where: { eventId: createdEvent.id },
                orderBy: { id: 'asc' }
            });

            const allFlatConditions = [];
            endConditions.forEach((ec, index) => {
                ec.conditions.forEach(cond => {
                    allFlatConditions.push({
                        endConditionId: endConditionsFromDb[index].id,
                        parameterName: cond.parameterName,
                        operator: cond.operator,
                        value: cond.value.toString()
                    });
                });
            });

            await prisma.endCondition.createMany({
                data: allFlatConditions
            });

            // Возвращаем созданный event с полной структурой
            return await prisma.event.findUnique({
                where: { id: createdEvent.id },
                include: {
                    endConditions: {
                        include: {
                            conditions: true
                        }
                    }
                }
            });
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Error creating event' });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { name, description, status, type, bankAmount, recipientId } = req.body;
    const userId = req.user.id; // Получаем ID пользователя из токена JWT

    try {
        // Проверяем, принадлежит ли событие данному пользователю
        const event = await prismaClient.event.findUnique({
            where: { id: parseInt(id) },
            include: {
                endConditions: true
            }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.userId !== userId) {
            return res.status(403).json({ error: 'You do not have permission to update this event' });
        }

        // Проверяем, что для типов DONATION и FUNDRAISING указан получатель
        if ((type === 'DONATION' || type === 'FUNDRAISING') && !recipientId) {
            return res.status(400).json({ 
                error: 'For types DONATION and FUNDRAISING, you must specify the recipient of the funds (recipientId)' 
            });
        }

        const updateData = {
            name,
            description,
            status,
            type,
            bankAmount
        };

        // Обрабатываем recipientId в зависимости от типа
        if (type === 'DONATION' || type === 'FUNDRAISING') {
            updateData.recipientId = parseInt(recipientId);
        } else if (type === 'JACKPOT') {
            // Для JACKPOT всегда убираем получателя (может быть определен только в конце)
            updateData.recipientId = null;
        }

        const updatedEvent = await prismaClient.event.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Error updating event' });
    }
};

exports.deleteEvent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // Получаем ID пользователя из токена JWT

    try {
        // Проверяем, принадлежит ли событие данному пользователю
        const event = await prismaClient.event.findUnique({
            where: { id: parseInt(id) },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.userId !== userId) {
            return res.status(403).json({ error: 'You do not have permission to delete this event' });
        }

        await prismaClient.event.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting event' });
    }
};
