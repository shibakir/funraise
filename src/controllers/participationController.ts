import { Request, Response } from 'express';
import { prisma } from '../index';
import { calculateUserBalance } from './transactionController';

export const createParticipation = async (req: Request, res: Response) => {
  try {
    const { userId, eventId, deposit } = req.body;

    if (!userId || !eventId || deposit === undefined) {
      return res.status(400).json({ error: 'UserId, eventId and deposit are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const balance = await calculateUserBalance(Number(userId));
    if (balance.availableBalance < Number(deposit)) {
      return res.status(400).json({ 
        error: 'Insufficient funds', 
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

    return res.status(201).json(participation);
  } catch (error) {
    console.error('Error creating participation:', error);
    return res.status(500).json({ error: 'Failed to create participation' });
  }
};

export const getUserParticipations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const participations = await prisma.participation.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
      include: { event: true }
    });

    return res.json(participations);
  } catch (error) {
    console.error('Error fetching user\'s event activities:', error);
    return res.status(500).json({ error: 'Failed to fetch user\'s event activities' });
  }
};

export const getEventParticipations = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const participations = await prisma.participation.findMany({
      where: { eventId: Number(eventId) },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, name: true } } }
    });

    return res.json(participations);
  } catch (error) {
    console.error('Error fetching event participations:', error);
    return res.status(500).json({ error: 'Failed to fetch participations' });
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
      return res.status(404).json({ error: 'Participation not found' });
    }

    return res.json(participation);
  } catch (error) {
    console.error('Error fetching participation:', error);
    return res.status(500).json({ error: 'Failed to fetch participation' });
  }
};

export const deleteParticipation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const participation = await prisma.participation.findUnique({
      where: { id: Number(id) }
    });

    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }

    await prisma.participation.delete({
      where: { id: Number(id) }
    });

    return res.json({ message: 'Participation successfully deleted' });
  } catch (error) {
    console.error('Error deleting participation:', error);
    return res.status(500).json({ error: 'Failed to delete participation' });
  }
};

export const increaseParticipationDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount to increase is required' });
    }

    const participation = await prisma.participation.findUnique({
      where: { id: Number(id) }
    });

    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }

    const balance = await calculateUserBalance(participation.userId);
    if (balance.availableBalance < Number(amount)) {
      return res.status(400).json({ 
        error: 'Insufficient funds', 
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

    return res.json(updatedParticipation);
  } catch (error) {
    console.error('Error increasing participation deposit:', error);
    return res.status(500).json({ error: 'Failed to increase participation deposit' });
  }
}; 