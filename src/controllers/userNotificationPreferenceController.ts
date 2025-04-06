import { Request, Response } from 'express';
import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export const getUserNotificationPreferences = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const userPreferences = await prisma.userNotificationPreference.findMany({
      where: { userId: Number(userId) },
      include: {
        notificationType: true,
        notificationChannel: true
      }
    });
    
    res.status(200).json(userPreferences);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.preference.fetch', 'Error getting user notification preferences') 
    });
  }
};

export const setUserNotificationPreference = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { notificationTypeId, notificationChannelId, isEnabled } = req.body;
  
  if (!notificationTypeId || !notificationChannelId) {
    return res.status(400).json({ 
      error: req.t('errors.preference.requiredFields', 'Notification type ID and channel ID are required') 
    });
  }

  try {
    // check if user exists
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: req.t('errors.user.notFound', 'User not found') 
      });
    }
    
    // check if notification type exists
    const notificationType = await prisma.notificationType.findUnique({
      where: { id: Number(notificationTypeId) }
    });
    
    if (!notificationType) {
      return res.status(404).json({ 
        error: req.t('errors.notificationType.notFound', 'Notification type not found') 
      });
    }
    
    // check if notification channel exists
    const notificationChannel = await prisma.notificationChannel.findUnique({
      where: { id: Number(notificationChannelId) }
    });
    
    if (!notificationChannel) {
      return res.status(404).json({ 
        error: req.t('errors.notificationChannel.notFound', 'Notification channel not found') 
      });
    }
    
    // check if existing preference exists
    const existingPreference = await prisma.userNotificationPreference.findFirst({
      where: {
        userId: Number(userId),
        notificationTypeId: Number(notificationTypeId),
        notificationChannelId: Number(notificationChannelId)
      }
    });
    
    let preference;
    
    // update or create preference
    if (existingPreference) {
      preference = await prisma.userNotificationPreference.update({
        where: { id: existingPreference.id },
        data: { isEnabled: isEnabled === undefined ? existingPreference.isEnabled : isEnabled },
        include: {
          notificationType: true,
          notificationChannel: true
        }
      });
    } else {
      preference = await prisma.userNotificationPreference.create({
        data: {
          userId: Number(userId),
          notificationTypeId: Number(notificationTypeId),
          notificationChannelId: Number(notificationChannelId),
          isEnabled: isEnabled === undefined ? true : isEnabled
        },
        include: {
          notificationType: true,
          notificationChannel: true
        }
      });
    }
    
    res.status(200).json(preference);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.preference.update', 'Error setting notification preference') 
    });
  }
};

export const deleteUserNotificationPreference = async (req: Request, res: Response) => {
  const { preferenceId } = req.params;
  
  try {
    await prisma.userNotificationPreference.delete({
      where: { id: Number(preferenceId) }
    });
    
    res.status(200).json({ 
      message: req.t('success.preference.deleted', 'Notification preference successfully deleted') 
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: req.t('errors.preference.notFound', 'Notification preference not found') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('errors.preference.delete', 'Error deleting notification preference') 
    });
  }
};

export const getUserNotificationPreferenceStatus = async (req: Request, res: Response) => {
  const { userId, typeId, channelId } = req.params;
  
  try {
    const preference = await prisma.userNotificationPreference.findFirst({
      where: {
        userId: Number(userId),
        notificationTypeId: Number(typeId),
        notificationChannelId: Number(channelId)
      },
      include: {
        notificationType: true,
        notificationChannel: true
      }
    });
    
    if (!preference) {
      return res.status(404).json({ 
        error: req.t('errors.preference.notFound', 'Notification preference not found') 
      });
    }
    
    res.status(200).json(preference);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.preference.fetchStatus', 'Error getting notification preference status') 
    });
  }
};

export const initUserNotificationPreferences = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    // check if user exists
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: req.t('errors.user.notFound', 'User not found') 
      });
    }
    
    // get all notification types
    const notificationTypes = await prisma.notificationType.findMany();
    
    // get all notification channels
    const notificationChannels = await prisma.notificationChannel.findMany();
    
    // create default preferences for all combinations
    const preferences = [];
    
    for (const type of notificationTypes) {
      for (const channel of notificationChannels) {
        // check if preference already exists
        const existingPreference = await prisma.userNotificationPreference.findFirst({
          where: {
            userId: Number(userId),
            notificationTypeId: type.id,
            notificationChannelId: channel.id
          }
        });
        
        if (!existingPreference) {
          const preference = await prisma.userNotificationPreference.create({
            data: {
              userId: Number(userId),
              notificationTypeId: type.id,
              notificationChannelId: channel.id,
              isEnabled: true // default enabled
            }
          });
          
          preferences.push(preference);
        }
      }
    }
    
    res.status(200).json({ 
      message: req.t('success.preference.initialized', 'User notification preferences successfully initialized'), 
      count: preferences.length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.preference.initialize', 'Error initializing user notification preferences') 
    });
  }
};
