import { Request, Response } from 'express';
import { prisma } from '../index';

export const createEndCondition = async (req: Request, res: Response) => {
  try {
    const { endConditionId, parameterName, operator, value } = req.body;

    if (!endConditionId || !parameterName || !operator || value === undefined) {
      return res.status(400).json({ error: req.t('endCondition.create.fieldsRequired') });
    }

    const eventEndCondition = await prisma.eventEndCondition.findUnique({
      where: { id: Number(endConditionId) }
    });

    if (!eventEndCondition) {
      return res.status(404).json({ error: req.t('endCondition.create.conditionGroupNotFound') });
    }

    const endCondition = await prisma.endCondition.create({
      data: {
        endConditionId: Number(endConditionId),
        parameterName,
        operator,
        value,
        isCompleted: false
      }
    });

    return res.status(201).json({
      ...endCondition,
      message: req.t('endCondition.create.success')
    });
  } catch (error) {
    console.error('Error creating end condition:', error);
    return res.status(500).json({ error: req.t('endCondition.create.error') });
  }
};

export const updateEndCondition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parameterName, operator, value, isCompleted } = req.body;

    const existingCondition = await prisma.endCondition.findUnique({
      where: { id: Number(id) }
    });

    if (!existingCondition) {
      return res.status(404).json({ error: req.t('endCondition.update.notFound') });
    }

    const updatedCondition = await prisma.endCondition.update({
      where: { id: Number(id) },
      data: {
        ...(parameterName && { parameterName }),
        ...(operator && { operator }),
        ...(value !== undefined && { value }),
        ...(isCompleted !== undefined && { isCompleted })
      }
    });

    return res.json({
      ...updatedCondition,
      message: req.t('endCondition.update.success')
    });
  } catch (error) {
    console.error('Error updating end condition:', error);
    return res.status(500).json({ error: req.t('endCondition.update.error') });
  }
};

export const deleteEndCondition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const condition = await prisma.endCondition.findUnique({
      where: { id: Number(id) }
    });

    if (!condition) {
      return res.status(404).json({ error: req.t('endCondition.delete.notFound') });
    }

    // check if this is the last condition in the group
    const conditionsCount = await prisma.endCondition.count({
      where: { endConditionId: condition.endConditionId }
    });

    if (conditionsCount <= 1) {
      return res.status(400).json({ error: req.t('endCondition.delete.lastCondition') });
    }

    await prisma.endCondition.delete({
      where: { id: Number(id) }
    });

    return res.json({ message: req.t('endCondition.delete.success') });
  } catch (error) {
    console.error('Error deleting end condition:', error);
    return res.status(500).json({ error: req.t('endCondition.delete.error') });
  }
};

export const getConditionsByGroup = async (req: Request, res: Response) => {
  try {
    const { eventEndConditionId } = req.params;

    const eventEndCondition = await prisma.eventEndCondition.findUnique({
      where: { id: Number(eventEndConditionId) }
    });

    if (!eventEndCondition) {
      return res.status(404).json({ error: req.t('endCondition.get.conditionGroupNotFound') });
    }

    const conditions = await prisma.endCondition.findMany({
      where: { endConditionId: Number(eventEndConditionId) }
    });

    return res.json(conditions);
  } catch (error) {
    console.error('Error fetching conditions:', error);
    return res.status(500).json({ error: req.t('endCondition.get.error') });
  }
}; 