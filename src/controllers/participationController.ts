import { Request, Response } from 'express';
import { prisma } from '../index';
import { calculateUserBalance } from './transactionController';

export const createParticipation = async (req: Request, res: Response) => {
  try {
    const { userId, eventId, deposit } = req.body;

    if (!userId || !eventId || deposit === undefined) {
      return res.status(400).json({ error: req.t('participation.create.fieldsRequired') });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: req.t('participation.create.userNotFound') });
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ error: req.t('participation.create.eventNotFound') });
    }

    const balance = await calculateUserBalance(Number(userId));
    if (balance.availableBalance < Number(deposit)) {
      return res.status(400).json({ 
        error: req.t('participation.create.insufficientFunds'), 
        availableBalance: balance.availableBalance,
        requiredAmount: Number(deposit)
      });
    }

    const participation = await prisma.participation.create({
      data: {
        deposit: Number(deposit),
        userId: Number(userId),
        eventId: Number(eventId)
      }
    });

    return res.status(201).json({
      ...participation,
      message: req.t('participation.create.success')
    });
  } catch (error) {
    console.error('Error creating participation:', error);
    return res.status(500).json({ error: req.t('participation.create.error') });
  }
};

export const getUserParticipations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: req.t('participation.getUserParticipations.userNotFound') });
    }

    const participations = await prisma.participation.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
      include: { event: true }
    });

    return res.json(participations);
  } catch (error) {
    console.error('Error fetching user\'s event activities:', error);
    return res.status(500).json({ error: req.t('participation.getUserParticipations.error') });
  }
};

export const getEventParticipations = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ error: req.t('participation.getEventParticipations.eventNotFound') });
    }

    const participations = await prisma.participation.findMany({
      where: { eventId: Number(eventId) },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, name: true } } }
    });

    return res.json(participations);
  } catch (error) {
    console.error('Error fetching event participations:', error);
    return res.status(500).json({ error: req.t('participation.getEventParticipations.error') });
  }
};

export const getParticipationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const participation = await prisma.participation.findUnique({
      where: { id: Number(id) },
      include: { 
        user: { select: { id: true, email: true, name: true } },
        event: true
      }
    });

    if (!participation) {
      return res.status(404).json({ error: req.t('participation.get.notFound') });
    }

    return res.json(participation);
  } catch (error) {
    console.error('Error fetching participation:', error);
    return res.status(500).json({ error: req.t('participation.get.error') });
  }
};

export const deleteParticipation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const participation = await prisma.participation.findUnique({
      where: { id: Number(id) }
    });

    if (!participation) {
      return res.status(404).json({ error: req.t('participation.delete.notFound') });
    }

    await prisma.participation.delete({
      where: { id: Number(id) }
    });

    return res.json({ message: req.t('participation.delete.success') });
  } catch (error) {
    console.error('Error deleting participation:', error);
    return res.status(500).json({ error: req.t('participation.delete.error') });
  }
};

export const increaseParticipationDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount === undefined) {
      return res.status(400).json({ error: req.t('participation.increaseDeposit.amountRequired') });
    }

    const participation = await prisma.participation.findUnique({
      where: { id: Number(id) }
    });

    if (!participation) {
      return res.status(404).json({ error: req.t('participation.increaseDeposit.notFound') });
    }

    const balance = await calculateUserBalance(participation.userId);
    if (balance.availableBalance < Number(amount)) {
      return res.status(400).json({ 
        error: req.t('participation.increaseDeposit.insufficientFunds'), 
        availableBalance: balance.availableBalance,
        requiredAmount: Number(amount)
      });
    }

    const updatedParticipation = await prisma.participation.update({
      where: { id: Number(id) },
      data: {
        deposit: { increment: Number(amount) }
      },
      include: { 
        user: { select: { id: true, email: true, name: true } },
        event: true
      }
    });

    return res.json({
      ...updatedParticipation,
      message: req.t('participation.increaseDeposit.success')
    });
  } catch (error) {
    console.error('Error increasing participation deposit:', error);
    return res.status(500).json({ error: req.t('participation.increaseDeposit.error') });
  }
};
