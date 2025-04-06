import { Request, Response } from 'express';
import { prisma } from '../index';

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || amount === undefined) {
      return res.status(400).json({ error: 'UserId and amount are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: Number(amount),
        userId: Number(userId)
      }
    });

    return res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
      include: { user: { select: { id: true, email: true, name: true } } }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, name: true } } }
    });
    
    return res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getUserBalance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await prisma.transaction.aggregate({
      where: { userId: Number(userId) },
      _sum: { amount: true }
    });

    const participationsResult = await prisma.participation.aggregate({
      where: { userId: Number(userId) },
      _sum: { deposit: true }
    });

    const totalTransactions = result._sum.amount || 0;
    const totalParticipations = participationsResult._sum.deposit || 0;
    const availableBalance = totalTransactions - totalParticipations;

    return res.json({
      totalDeposits: totalTransactions,
      usedInParticipations: totalParticipations,
      availableBalance: availableBalance
    });
  } catch (error) {
    console.error('Error calculating user balance:', error);
    return res.status(500).json({ error: 'Failed to calculate balance' });
  }
};

// Helper function to calculate user balance (for internal use)
export const calculateUserBalance = async (userId: number) => {

  const result = await prisma.transaction.aggregate({
    where: { userId: Number(userId) },
    _sum: { amount: true }
  });

  const participationsResult = await prisma.participation.aggregate({
    where: { userId: Number(userId) },
    _sum: { deposit: true }
  });

  const totalTransactions = result._sum.amount || 0;
  const totalParticipations = participationsResult._sum.deposit || 0;
  const availableBalance = totalTransactions - totalParticipations;

  return {
    totalDeposits: totalTransactions,
    usedInParticipations: totalParticipations,
    availableBalance: availableBalance
  };
}; 