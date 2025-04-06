import { Request, Response } from 'express';
import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export const getAllNotificationChannels = async (req: Request, res: Response) => {
  try {
    const notificationChannels = await prisma.notificationChannel.findMany();
    res.status(200).json(notificationChannels);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('notificationChannel.getAll.error', 'Error fetching notification channels') 
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
        error: req.t('notificationChannel.get.notFound', 'Notification channel not found') 
      });
    }
    
    res.status(200).json(notificationChannel);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('notificationChannel.get.error', 'Error fetching notification channel') 
    });
  }
};

export const createNotificationChannel = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      error: req.t('notificationChannel.create.nameRequired', 'Channel name is required') 
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
          error: req.t('notificationChannel.create.nameExists', 'Notification channel with this name already exists') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('notificationChannel.create.error', 'Error creating notification channel') 
    });
  }
};

export const updateNotificationChannel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      error: req.t('notificationChannel.update.nameRequired', 'Channel name is required') 
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
          error: req.t('notificationChannel.update.notFound', 'Notification channel not found') 
        });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: req.t('notificationChannel.update.nameExists', 'Notification channel with this name already exists') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('notificationChannel.update.error', 'Error updating notification channel') 
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
      message: req.t('notificationChannel.delete.success', 'Notification channel successfully deleted') 
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: req.t('notificationChannel.delete.notFound', 'Notification channel not found') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('notificationChannel.delete.error', 'Error deleting notification channel') 
    });
  }
};
