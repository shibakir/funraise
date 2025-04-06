import { Request, Response } from 'express';
import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export const getAllNotificationChannels = async (req: Request, res: Response) => {
  try {
    const notificationChannels = await prisma.notificationChannel.findMany();
    res.status(200).json(notificationChannels);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.notificationChannel.fetch', 'Error fetching notification channels') 
    });
  }
};

export const getNotificationChannelById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const notificationChannel = await prisma.notificationChannel.findUnique({
      where: { id: Number(id) }
    });
    
    if (!notificationChannel) {
      return res.status(404).json({ 
        error: req.t('errors.notificationChannel.notFound', 'Notification channel not found') 
      });
    }
    
    res.status(200).json(notificationChannel);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.notificationChannel.fetchById', 'Error fetching notification channel') 
    });
  }
};

export const createNotificationChannel = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      error: req.t('errors.notificationChannel.nameRequired', 'Channel name is required') 
    });
  }
  
  try {
    const notificationChannel = await prisma.notificationChannel.create({
      data: {
        name,
        description
      }
    });
    
    res.status(201).json(notificationChannel);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: req.t('errors.notificationChannel.nameExists', 'Notification channel with this name already exists') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('errors.notificationChannel.create', 'Error creating notification channel') 
    });
  }
};

export const updateNotificationChannel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      error: req.t('errors.notificationChannel.nameRequired', 'Channel name is required') 
    });
  }
  
  try {
    const notificationChannel = await prisma.notificationChannel.update({
      where: { id: Number(id) },
      data: {
        name,
        description
      }
    });
    
    res.status(200).json(notificationChannel);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: req.t('errors.notificationChannel.notFound', 'Notification channel not found') 
        });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: req.t('errors.notificationChannel.nameExists', 'Notification channel with this name already exists') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('errors.notificationChannel.update', 'Error updating notification channel') 
    });
  }
};

export const deleteNotificationChannel = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await prisma.notificationChannel.delete({
      where: { id: Number(id) }
    });
    
    res.status(200).json({ 
      message: req.t('success.notificationChannel.deleted', 'Notification channel successfully deleted') 
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: req.t('errors.notificationChannel.notFound', 'Notification channel not found') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('errors.notificationChannel.delete', 'Error deleting notification channel') 
    });
  }
};
