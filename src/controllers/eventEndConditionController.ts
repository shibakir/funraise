import { Request, Response } from 'express';
import { prisma } from '../index';

export const createEventEndCondition = async (req: Request, res: Response) => {
  try {
    const { eventId, conditions } = req.body;

    if (!eventId || !conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return res.status(400).json({ error: req.t('eventEndCondition.create.fieldsRequired') });
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ error: req.t('eventEndCondition.create.eventNotFound') });
    }

    const eventEndCondition = await prisma.eventEndCondition.create({
      data: {
        eventId: Number(eventId),
        isCompleted: false,
        conditions: {
          create: conditions.map(condition => ({
            parameterName: condition.parameterName,
            operator: condition.operator,
            value: condition.value,
            isCompleted: false
          }))
        }
      },
      include: {
        conditions: true
      }
    });

    return res.status(201).json({
      ...eventEndCondition,
      message: req.t('eventEndCondition.create.success')
    });
  } catch (error) {
    console.error('Error creating event end condition:', error);
    return res.status(500).json({ error: req.t('eventEndCondition.create.error') });
  }
};

export const getEventEndConditions = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ error: req.t('eventEndCondition.get.eventNotFound') });
    }

    const eventEndConditions = await prisma.eventEndCondition.findMany({
      where: { eventId: Number(eventId) },
      include: {
        conditions: true
      }
    });

    return res.json(eventEndConditions);
  } catch (error) {
    console.error('Error fetching event end conditions:', error);
    return res.status(500).json({ error: req.t('eventEndCondition.get.error') });
  }
};

export const updateEventEndConditionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;

    if (isCompleted === undefined) {
      return res.status(400).json({ error: req.t('eventEndCondition.update.fieldsRequired') });
    }

    const existingCondition = await prisma.eventEndCondition.findUnique({
      where: { id: Number(id) }
    });

    if (!existingCondition) {
      return res.status(404).json({ error: req.t('eventEndCondition.update.notFound') });
    }

    const updatedCondition = await prisma.eventEndCondition.update({
      where: { id: Number(id) },
      data: { isCompleted },
      include: {
        conditions: true
      }
    });

    return res.json({
      ...updatedCondition,
      message: req.t('eventEndCondition.update.success')
    });
  } catch (error) {
    console.error('Error updating event end condition:', error);
    return res.status(500).json({ error: req.t('eventEndCondition.update.error') });
  }
};

export const deleteEventEndCondition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const condition = await prisma.eventEndCondition.findUnique({
      where: { id: Number(id) }
    });

    if (!condition) {
      return res.status(404).json({ error: req.t('eventEndCondition.delete.notFound') });
    }

    // check if there are other end conditions for this event
    const conditionsCount = await prisma.eventEndCondition.count({
      where: { 
        eventId: condition.eventId,
        NOT: { id: Number(id) }
      }
    });

    if (conditionsCount === 0) {
      return res.status(400).json({ error: req.t('eventEndCondition.delete.lastCondition') });
    }

    await prisma.eventEndCondition.delete({
      where: { id: Number(id) }
    });

    return res.json({ message: req.t('eventEndCondition.delete.success') });
  } catch (error) {
    console.error('Error deleting event end condition:', error);
    return res.status(500).json({ error: req.t('eventEndCondition.delete.error') });
  }
}; 