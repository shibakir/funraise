import { Request, Response } from 'express';
import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export const getAllNotificationTypes = async (req: Request, res: Response) => {
  try {
    const notificationTypes = await prisma.notificationType.findMany();
    res.status(200).json(notificationTypes);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.notificationType.fetch', 'Error fetching notification types') 
    });
  }
};

export const getNotificationTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const notificationType = await prisma.notificationType.findUnique({
      where: { id: Number(id) }
    });

    if (!notificationType) {
      return res.status(404).json({ 
        error: req.t('errors.notificationType.notFound', 'Notification type not found') 
      });
    }
    
    res.status(200).json(notificationType);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.notificationType.fetchById', 'Error fetching notification type') 
    });
  }
};

export const createNotificationType = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      error: req.t('errors.notificationType.nameRequired', 'Type name is required') 
    });
  }
  
  try {
    const notificationType = await prisma.notificationType.create({
      data: {
        name,
        description
      }
    });
    
    res.status(201).json(notificationType);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: req.t('errors.notificationType.nameExists', 'Notification type with this name already exists') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('errors.notificationType.create', 'Error creating notification type') 
    });
  }
};

export const updateNotificationType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      error: req.t('errors.notificationType.nameRequired', 'Notification type name is required') 
    });
  }
  
  try {
    const notificationType = await prisma.notificationType.update({
      where: { id: Number(id) },
      data: {
        name,
        description
      }
    });
    
    res.status(200).json(notificationType);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: req.t('errors.notificationType.notFound', 'Notification type not found') 
        });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: req.t('errors.notificationType.nameExists', 'Notification type with this name already exists') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('errors.notificationType.update', 'Error updating notification type') 
    });
  }
};

export const deleteNotificationType = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await prisma.notificationType.delete({
      where: { id: Number(id) }
    });
    
    res.status(200).json({ 
      message: req.t('success.notificationType.deleted', 'Notification type successfully deleted') 
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: req.t('errors.notificationType.notFound', 'Notification type not found') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('errors.notificationType.delete', 'Error deleting notification type') 
    });
  }
};
