import { Request, Response } from 'express';
import { prisma } from '../index';

// Implement Prisma interfaces
interface Criterion {
  id: number;
  achievementId: number;
  criteriaType: string;
  criteriaValue: number;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const getUserAchievements = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: Number(userId) },
      include: {
        achievement: {
          include: {
            criteria: true
          }
        },
        progress: {
          include: {
            criterion: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json(userAchievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
};

export const getUserAchievementById = async (req: Request, res: Response) => {
  try {
    const { id: userId, achievementId } = req.params;

    const userAchievement = await prisma.userAchievement.findFirst({
      where: { 
        userId: Number(userId),
        achievementId: Number(achievementId)
      },
      include: {
        achievement: {
          include: {
            criteria: true
          }
        },
        progress: {
          include: {
            criterion: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!userAchievement) {
      return res.status(404).json({ error: 'User achievement not found' });
    }

    return res.json(userAchievement);
  } catch (error) {
    console.error('Error fetching user achievement:', error);
    return res.status(500).json({ error: 'Failed to fetch user achievement' });
  }
};

export const initUserAchievement = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;
    const { achievementId } = req.body;

    if (!achievementId) {
      return res.status(400).json({ error: 'Achievement ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: Number(achievementId) },
      include: { criteria: true }
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const existingUserAchievement = await prisma.userAchievement.findFirst({
      where: {
        userId: Number(userId),
        achievementId: Number(achievementId)
      }
    });

    if (existingUserAchievement) {
      return res.status(400).json({ error: 'User already has this achievement initialized' });
    }

    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId: Number(userId),
        achievementId: Number(achievementId),
        status: 'IN_PROGRESS',
        progress: {
          create: achievement.criteria.map((criterion: Criterion) => ({
            criterionId: criterion.id,
            currentValue: 0,
            isCompleted: false
          }))
        }
      },
      include: {
        achievement: true,
        progress: {
          include: {
            criterion: true
          }
        }
      }
    });

    return res.status(201).json(userAchievement);
  } catch (error) {
    console.error('Error initializing user achievement:', error);
    return res.status(500).json({ error: 'Failed to initialize user achievement' });
  }
};

export const updateCriterionProgress = async (req: Request, res: Response) => {
  try {
    const { id: userId, progressId } = req.params;
    const { currentValue, isCompleted } = req.body;

    const progress = await prisma.userCriterionProgress.findFirst({
      where: { 
        id: Number(progressId),
        userAchievement: {
          userId: Number(userId)
        }
      },
      include: {
        criterion: true,
        userAchievement: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress record not found for this user' });
    }

    const updatedProgress = await prisma.userCriterionProgress.update({
      where: { id: Number(progressId) },
      data: {
        ...(currentValue !== undefined && { currentValue: Number(currentValue) }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(isCompleted === true && !progress.completedAt && { completedAt: new Date() })
      },
      include: {
        criterion: true
      }
    });

    const allCriteriaProgress = await prisma.userCriterionProgress.findMany({
      where: {
        userAchievementId: progress.userAchievementId
      }
    });

    const allCompleted = allCriteriaProgress.every((p: { isCompleted: boolean }) => p.isCompleted);

    if (allCompleted) {
      await prisma.userAchievement.update({
        where: { id: progress.userAchievementId },
        data: {
          status: 'COMPLETED',
          unlockedAt: new Date()
        }
      });
    }

    return res.json(updatedProgress);
  } catch (error) {
    console.error('Error updating criterion progress:', error);
    return res.status(500).json({ error: 'Failed to update criterion progress' });
  }
};
/*
export const checkAndUpdateProgressByType = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;
    const { criteriaType, value } = req.body;

    if (!criteriaType || value === undefined) {
      return res.status(400).json({ error: 'Criteria type and value are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const criteria = await prisma.achievementCriterion.findMany({
      where: { criteriaType }
    });

    if (criteria.length === 0) {
      return res.status(404).json({ error: 'No criteria found for this type' });
    }

    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: Number(userId),
        achievement: {
          criteria: {
            some: {
              criteriaType
            }
          }
        }
      },
      include: {
        progress: {
          include: {
            criterion: true
          }
        }
      }
    });

    const updates = [];
    for (const ua of userAchievements) {
      for (const progress of ua.progress) {
        if (progress.criterion.criteriaType === criteriaType) {
          // If current value is less or
          if (progress.currentValue < Number(value) && !progress.isCompleted) {
            const isNowCompleted = Number(value) >= progress.criterion.criteriaValue;
            
            updates.push(
              prisma.userCriterionProgress.update({
                where: { id: progress.id },
                data: {
                  currentValue: Number(value),
                  isCompleted: isNowCompleted,
                  ...(isNowCompleted && { completedAt: new Date() })
                }
              })
            );
          }
        }
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    for (const ua of userAchievements) {
      const allProgress = await prisma.userCriterionProgress.findMany({
        where: { userAchievementId: ua.id }
      });
      
      const allCompleted = allProgress.every((p: { isCompleted: boolean }) => p.isCompleted);
      
      if (allCompleted && ua.status !== 'COMPLETED') {
        await prisma.userAchievement.update({
          where: { id: ua.id },
          data: {
            status: 'COMPLETED',
            unlockedAt: new Date()
          }
        });
      }
    }

    const updatedUserAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: Number(userId),
        achievement: {
          criteria: {
            some: {
              criteriaType
            }
          }
        }
      },
      include: {
        progress: {
          include: {
            criterion: true
          }
        },
        achievement: true
      }
    });

    return res.json({
      message: `Updated progress for criteria type: ${criteriaType}`,
      updatedAchievements: updatedUserAchievements
    });
  } catch (error) {
    console.error('Error checking and updating progress:', error);
    return res.status(500).json({ error: 'Failed to update progress' });
  }
};
 */