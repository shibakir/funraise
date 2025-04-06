import { Request, Response } from 'express';
import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export const getUserNotifications = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page = '1', limit = '10', isRead } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;
  
  try {
    const where: any = {
      deliveries: {
        some: {
          userId: Number(userId),
          notificationChannel: {
            name: 'IN_APP'
          }
        }
      }
    };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          notificationType: true,
          deliveries: {
            where: {
              userId: Number(userId),
              notificationChannel: {
                name: 'IN_APP'
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.notification.count({ where })
    ]);
    
    res.status(200).json({
      data: notifications,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: req.t('notification.getAll.error', 'Error getting user notifications') 
    });
  }
};

export const getNotificationById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: Number(id) },
      include: {
        notificationType: true,
        deliveries: true
      }
    });
    
    if (!notification) {
      return res.status(404).json({ 
        error: req.t('notification.get.notFound', 'Notification not found') 
      });
    }
    
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('notification.get.error', 'Error getting notification') 
    });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  const { title, content, notificationTypeId, referenceId, referenceType, userIds } = req.body;
  
  if (!title || !content || !notificationTypeId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ 
      error: req.t('notification.create.fieldsRequired', 'All required fields must be filled (title, content, notification type, user IDs)') 
    });
  }
  
  try {
    // check if notification type exists
    const notificationType = await prisma.notificationType.findUnique({
      where: { id: Number(notificationTypeId) }
    });
    
    if (!notificationType) {
      return res.status(404).json({ 
        error: req.t('notificationType.get.notFound', 'Notification type not found') 
      });
    }
    
    // get all channels
    const channels = await prisma.notificationChannel.findMany();
    
    // create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        notificationTypeId: Number(notificationTypeId),
        referenceId,
        referenceType,
        isRead: false
      }
    });
    
    // create delivery records for each user and channel
    const deliveries = [];
    
    for (const userId of userIds) {
      // check user preferences for this notification type
      const userPreferences = await prisma.userNotificationPreference.findMany({
        where: {
          userId: Number(userId),
          notificationTypeId: Number(notificationTypeId),
          isEnabled: true
        },
        include: {
          notificationChannel: true
        }
      });
      
      // if user has no preferences, use all channels
      const enabledChannels = userPreferences.length > 0
        ? userPreferences.map(pref => pref.notificationChannel)
        : channels;
      
      // create delivery records for each channel
      for (const channel of enabledChannels) {
        const delivery = await prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            notificationChannelId: channel.id,
            userId: Number(userId),
            status: 'PENDING'
          }
        });
        
        deliveries.push(delivery);
      }
    }
    
    res.status(201).json({ 
      notification, 
      deliveries, 
      message: req.t('notification.create.success', 'Notification created successfully') 
    });
  } catch (error) {
    res.status(500).json({ 
      error: req.t('notification.create.error', 'Error creating notification') 
    });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const notification = await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true }
    });
    
    res.status(200).json(notification);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: req.t('notification.get.notFound', 'Notification not found') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('notification.markRead.error', 'Error updating notification status') 
    });
  }
};
/*
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const deliveries = await prisma.notificationDelivery.findMany({
      where: {
        userId: Number(userId),
        notificationChannel: {
          name: 'IN_APP'
        }
      },
      select: {
        notificationId: true
      }
    });
    
    const notificationIds = deliveries.map(d => d.notificationId);

    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        isRead: false
      },
      data: {
        isRead: true
      }
    });
    
    res.status(200).json({ 
      message: req.t('notification.markAllRead.success', 'All notifications marked as read'), 
      count: notificationIds.length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: req.t('notification.markAllRead.error', 'Error updating notification status') 
    });
  }
};
*/

export const updateDeliveryStatus = async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const { status, failureReason } = req.body;
  
  if (!status) {
    return res.status(400).json({ 
      error: req.t('notification.delivery.update.statusRequired', 'Delivery status is required') 
    });
  }
  
  try {
    const data: any = { status };
    
    // if status is "SENT", set sent time
    if (status === 'SENT') {
      data.sentAt = new Date();
    }
    
    // if status is "FAILED", save failure reason
    if (status === 'FAILED' && failureReason) {
      data.failureReason = failureReason;
    }
    
    const delivery = await prisma.notificationDelivery.update({
      where: { id: Number(deliveryId) },
      data
    });
    
    res.status(200).json(delivery);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: req.t('notification.delivery.get.notFound', 'Delivery not found') 
        });
      }
    }
    res.status(500).json({ 
      error: req.t('notification.delivery.update.error', 'Error updating delivery status') 
    });
  }
};
