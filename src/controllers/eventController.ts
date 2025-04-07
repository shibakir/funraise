import { Request, Response } from 'express';
import { prisma } from '../index';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { userId, name, description, status, endConditions } = req.body;

    if (!userId || !name || !status) {
      return res.status(400).json({ error: req.t('event.create.fieldsRequired') });
    }

    if (!endConditions || !Array.isArray(endConditions) || endConditions.length === 0) {
      return res.status(400).json({ error: req.t('event.create.endConditionsRequired') });
    }

    for (const condition of endConditions) {
      if (!condition.conditions || !Array.isArray(condition.conditions) || condition.conditions.length === 0) {
        return res.status(400).json({ error: req.t('event.create.subConditionsRequired') });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: req.t('event.create.userNotFound') });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        bankAmount: 0, // default value
        status,
        userId: Number(userId),
        endConditions: {
          create: endConditions.map(condition => ({
            isCompleted: false,
            conditions: {
              create: condition.conditions.map((subCondition: any) => ({
                parameterName: subCondition.parameterName,
                operator: subCondition.operator,
                value: subCondition.value,
                isCompleted: false
              }))
            }
          }))
        }
      },
      include: {
        endConditions: {
          include: {
            conditions: true
          }
        }
      }
    });

    return res.status(201).json({
      ...event,
      message: req.t('event.create.success')
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: req.t('event.create.error') });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { select: { id: true, email: true, name: true } },
        endConditions: {
          include: {
            conditions: true
          }
        }
      }
    });
    
    return res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: req.t('event.getAll.error') });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: { 
        user: { select: { id: true, email: true, name: true } },
        endConditions: {
          include: {
            conditions: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: req.t('event.get.notFound') });
    }

    return res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ error: req.t('event.get.error') });
  }
};

export const getUserEvents = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: req.t('event.getUserEvents.userNotFound') });
    }

    const events = await prisma.event.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
      include: {
        endConditions: {
          include: {
            conditions: true
          }
        }
      }
    });

    return res.json(events);
  } catch (error) {
    console.error('Error fetching user events:', error);
    return res.status(500).json({ error: req.t('event.getUserEvents.error') });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, bankAmount, status } = req.body;

    const existingEvent = await prisma.event.findUnique({
      where: { id: Number(id) }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: req.t('event.update.notFound') });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(bankAmount !== undefined && { bankAmount: Number(bankAmount) }),
        ...(status && { status })
      },
      include: { 
        user: { select: { id: true, email: true, name: true } },
        endConditions: {
          include: {
            conditions: true
          }
        }
      }
    });

    return res.json({
      ...updatedEvent,
      message: req.t('event.update.success')
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: req.t('event.update.error') });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: Number(id) }
    });

    if (!event) {
      return res.status(404).json({ error: req.t('event.delete.notFound') });
    }

    await prisma.event.delete({
      where: { id: Number(id) }
    });

    return res.json({ message: req.t('event.delete.success') });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: req.t('event.delete.error') });
  }
}; 