import { Request, Response } from 'express';
import { prisma } from '../index';

export const getAllAchievements = async (req: Request, res: Response) => {
  try {
    const achievements = await prisma.achievement.findMany({
      include: {
        criteria: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

export const getAchievementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const achievement = await prisma.achievement.findUnique({
      where: { id: Number(id) },
      include: { criteria: true }
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    return res.json(achievement);
  } catch (error) {
    console.error('Error fetching achievement:', error);
    return res.status(500).json({ error: 'Failed to fetch achievement' });
  }
};

export const createAchievement = async (req: Request, res: Response) => {
  try {
    const { name, description, iconUrl, criteria } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Achievement name is required' });
    }

    // Создаем достижение
    const achievement = await prisma.achievement.create({
      data: {
        name,
        description,
        iconUrl,
        criteria: {
          create: criteria || []
        }
      },
      include: {
        criteria: true
      }
    });

    return res.status(201).json(achievement);
  } catch (error) {
    console.error('Error creating achievement:', error);
    return res.status(500).json({ error: 'Failed to create achievement' });
  }
};

export const updateAchievement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, iconUrl } = req.body;

    const achievement = await prisma.achievement.findUnique({
      where: { id: Number(id) }
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const updatedAchievement = await prisma.achievement.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(iconUrl !== undefined && { iconUrl })
      },
      include: { criteria: true }
    });

    return res.json(updatedAchievement);
  } catch (error) {
    console.error('Error updating achievement:', error);
    return res.status(500).json({ error: 'Failed to update achievement' });
  }
};

export const deleteAchievement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const achievement = await prisma.achievement.findUnique({
      where: { id: Number(id) }
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    // delete all associated items included criteria and users progresses
    await prisma.$transaction([
      prisma.userCriterionProgress.deleteMany({
        where: {
          criterion: {
            achievementId: Number(id)
          }
        }
      }),
      prisma.achievementCriterion.deleteMany({
        where: { achievementId: Number(id) }
      }),
      prisma.userAchievement.deleteMany({
        where: { achievementId: Number(id) }
      }),
      prisma.achievement.delete({
        where: { id: Number(id) }
      })
    ]);

    return res.json({ message: 'Achievement successfully deleted' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return res.status(500).json({ error: 'Failed to delete achievement' });
  }
};

export const addCriterionToAchievement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { criteriaType, criteriaValue, description } = req.body;
    
    if (!criteriaType || criteriaValue === undefined) {
      return res.status(400).json({ error: 'Criteria type and value are required' });
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id: Number(id) }
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const criterion = await prisma.achievementCriterion.create({
      data: {
        criteriaType,
        criteriaValue: Number(criteriaValue),
        description,
        achievementId: Number(id)
      }
    });

    return res.status(201).json(criterion);
  } catch (error) {
    console.error('Error adding criterion:', error);
    return res.status(500).json({ error: 'Failed to add criterion' });
  }
};

export const updateCriterion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { criteriaType, criteriaValue, description } = req.body;

    const criterion = await prisma.achievementCriterion.findUnique({
      where: { id: Number(id) }
    });

    if (!criterion) {
      return res.status(404).json({ error: 'Criterion not found' });
    }

    const updatedCriterion = await prisma.achievementCriterion.update({
      where: { id: Number(id) },
      data: {
        ...(criteriaType && { criteriaType }),
        ...(criteriaValue !== undefined && { criteriaValue: Number(criteriaValue) }),
        ...(description !== undefined && { description })
      }
    });

    return res.json(updatedCriterion);
  } catch (error) {
    console.error('Error updating criterion:', error);
    return res.status(500).json({ error: 'Failed to update criterion' });
  }
};

export const deleteCriterion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const criterion = await prisma.achievementCriterion.findUnique({
      where: { id: Number(id) }
    });

    if (!criterion) {
      return res.status(404).json({ error: 'Criterion not found' });
    }

    // also delete associated to criterion users progresses
    await prisma.$transaction([
      prisma.userCriterionProgress.deleteMany({
        where: { criterionId: Number(id) }
      }),
      prisma.achievementCriterion.delete({
        where: { id: Number(id) }
      })
    ]);

    return res.json({ message: 'Criterion successfully deleted' });
  } catch (error) {
    console.error('Error deleting criterion:', error);
    return res.status(500).json({ error: 'Failed to delete criterion' });
  }
}; 