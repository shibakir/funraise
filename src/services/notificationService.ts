import { prisma } from '../index';
import nodemailer from 'nodemailer';
import { Prisma } from '@prisma/client';

// Constants for log messages
const LOG_MESSAGES = {
  PROCESSING: 'Processing %d pending deliveries',
  UNKNOWN_CHANNEL: 'Unknown notification channel: %s',
  ERROR_DELIVERY: 'Error delivering notification ID %d:',
  DELIVERY_NOT_FOUND: 'Delivery with ID %d not found',
  FAILURE_UPDATE: 'Failed to update delivery status %d:',
  PUSH_SENDING: '[PUSH] Sending notification to user %d: %s',
  ERROR_EVENT: 'Error sending event notification:',
  ERROR_ACHIEVEMENT: 'Error sending achievement notification:',
  PRISMA_ERROR: 'Prisma error sending %s notification: %s',
  TYPE_NOT_FOUND: 'Notification type %s not found'
};

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password'
  }
});

/**
 * Process and send notifications
 */
export const processNotificationDeliveries = async () => {
  try {
    const pendingDeliveries = await prisma.notificationDelivery.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        notification: true,
        notificationChannel: true,
        user: true
      }
    });
    
    console.log(LOG_MESSAGES.PROCESSING, pendingDeliveries.length);
    
    for (const delivery of pendingDeliveries) {
      try {
        switch (delivery.notificationChannel.name) {
          case 'EMAIL':
            await sendEmailNotification(delivery);
            break;
          case 'IN_APP':
            await markDeliveryAsSent(delivery.id);
            break;
          case 'PUSH':
            await sendPushNotification(delivery);
            break;
          default:
            console.warn(LOG_MESSAGES.UNKNOWN_CHANNEL, delivery.notificationChannel.name);
            await markDeliveryAsFailed(delivery.id, 'Unknown notification channel');
        }
      } catch (error) {
        console.error(LOG_MESSAGES.ERROR_DELIVERY, delivery.id, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await markDeliveryAsFailed(delivery.id, errorMessage);
      }
    }
    
    return `Processed ${pendingDeliveries.length} notifications`;
  } catch (error) {
    console.error(LOG_MESSAGES.ERROR_EVENT, error);
    throw error;
  }
};

// Typing for delivery
interface NotificationDelivery {
  id: number;
  user: {
    email?: string | null;
  };
  notification: {
    title: string;
    content: string;
  };
  userId: number;
}

/**
 * Send email notification
 */
const sendEmailNotification = async (delivery: NotificationDelivery) => {
  if (!delivery.user.email) {
    throw new Error('Email address not found');
  }
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    to: delivery.user.email,
    subject: delivery.notification.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${delivery.notification.title}</h2>
        <p>${delivery.notification.content}</p>
        <hr>
        <p style="font-size: 12px; color: #777;">This is an automated notification. Please do not reply to this email.</p>
      </div>
    `
  };
  
  await emailTransporter.sendMail(mailOptions);
  await markDeliveryAsSent(delivery.id);
};

/**
 * Send push notification
 */
const sendPushNotification = async (delivery: NotificationDelivery) => {
  // TODO: implement push notification
  console.log(LOG_MESSAGES.PUSH_SENDING, delivery.userId, delivery.notification.title);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  await markDeliveryAsSent(delivery.id);
};

/**
 * Mark delivery as sent
 */
const markDeliveryAsSent = async (deliveryId: number) => {
  try {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        console.error(LOG_MESSAGES.DELIVERY_NOT_FOUND, deliveryId);
      }
    }
    throw error;
  }
};

/**
 * Mark delivery as failed
 */
const markDeliveryAsFailed = async (deliveryId: number, reason: string) => {
  try {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'FAILED',
        failureReason: reason
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        console.error(LOG_MESSAGES.DELIVERY_NOT_FOUND, deliveryId);
      }
    }
    console.error(LOG_MESSAGES.FAILURE_UPDATE, deliveryId, error);
  }
};

/**
 * Send event notification to multiple users
 */
export const sendEventNotification = async (
  eventId: number,
  title: string,
  content: string,
  userIds: number[]
) => {
  try {
    const notificationType = await prisma.notificationType.findFirst({
      where: { name: 'EVENT' }
    });
    
    if (!notificationType) {
      throw new Error(LOG_MESSAGES.TYPE_NOT_FOUND.replace('%s', 'EVENT'));
    }
    
    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        notificationTypeId: notificationType.id,
        referenceId: String(eventId),
        referenceType: 'EVENT',
        isRead: false
      }
    });
    
    const channels = await prisma.notificationChannel.findMany();
    
    for (const userId of userIds) {
      const userPreferences = await prisma.userNotificationPreference.findMany({
        where: {
          userId,
          notificationTypeId: notificationType.id,
          isEnabled: true
        },
        include: {
          notificationChannel: true
        }
      });
      
      if (userPreferences.length === 0) {
        continue;
      }
      
      for (const pref of userPreferences) {
        await prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            notificationChannelId: pref.notificationChannelId,
            userId,
            status: 'PENDING'
          }
        });
      }
    }
    
    return processNotificationDeliveries();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(LOG_MESSAGES.PRISMA_ERROR, 'event', error.code, error);
    } else if (error instanceof Error) {
      console.error(LOG_MESSAGES.ERROR_EVENT, error.message);
    } else {
      console.error(LOG_MESSAGES.ERROR_EVENT);
    }
    throw error;
  }
};

/**
 * Send achievement notification to a user
 */
export const sendAchievementNotification = async (
  userId: number,
  achievementId: number,
  achievementName: string
) => {
  try {
    const notificationType = await prisma.notificationType.findFirst({
      where: { name: 'ACHIEVEMENT' }
    });
    
    if (!notificationType) {
      throw new Error(LOG_MESSAGES.TYPE_NOT_FOUND.replace('%s', 'ACHIEVEMENT'));
    }
    
    const notification = await prisma.notification.create({
      data: {
        title: 'New achievement!',
        content: `You have achieved: ${achievementName}`,
        notificationTypeId: notificationType.id,
        referenceId: String(achievementId),
        referenceType: 'ACHIEVEMENT',
        isRead: false
      }
    });
    
    const userPreferences = await prisma.userNotificationPreference.findMany({
      where: {
        userId,
        notificationTypeId: notificationType.id,
        isEnabled: true
      },
      include: {
        notificationChannel: true
      }
    });
    
    const channels = userPreferences.length > 0
      ? userPreferences
      : await prisma.notificationChannel.findMany().then(channels => 
          channels.map(channel => ({ notificationChannelId: channel.id }))
        );
    
    for (const pref of channels) {
      await prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          notificationChannelId: pref.notificationChannelId,
          userId,
          status: 'PENDING'
        }
      });
    }
    
    return processNotificationDeliveries();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(LOG_MESSAGES.PRISMA_ERROR, 'achievement', error.code, error);
    } else if (error instanceof Error) {
      console.error(LOG_MESSAGES.ERROR_ACHIEVEMENT, error.message);
    } else {
      console.error(LOG_MESSAGES.ERROR_ACHIEVEMENT);
    }
    throw error;
  }
}; 