import { prisma } from '../index';
import nodemailer from 'nodemailer';
import { Prisma } from '@prisma/client';

// EMAIL TRANSPORTER
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password'
  }
});

export const processNotificationDeliveries = async () => {
  try {
    // get all pending deliveries
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
    
    console.log(`Processing ${pendingDeliveries.length} pending deliveries`);
    
    // process each delivery
    for (const delivery of pendingDeliveries) {
      try {
        // depending on the notification channel, select the delivery method
        switch (delivery.notificationChannel.name) {
          case 'EMAIL':
            await sendEmailNotification(delivery);
            break;
          case 'IN_APP':
            // for in-app notifications, just mark as sent
            await markDeliveryAsSent(delivery.id);
            break;
          case 'PUSH':
            await sendPushNotification(delivery);
            break;
          default:
            console.warn(`Unknown notification channel: ${delivery.notificationChannel.name}`);
            await markDeliveryAsFailed(delivery.id, 'Unknown notification channel');
        }
      } catch (error) {
        console.error(`Error delivering notification ID ${delivery.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await markDeliveryAsFailed(delivery.id, errorMessage);
      }
    }
    
    return `Processed ${pendingDeliveries.length} notifications`;
  } catch (error) {
    console.error('Error processing notifications:', error);
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

const sendEmailNotification = async (delivery: NotificationDelivery) => {
  if (!delivery.user.email) {
    throw new Error('Адрес электронной почты не найден');
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
        <p style="font-size: 12px; color: #777;">Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
      </div>
    `
  };
  
  // Отправка письма
  await emailTransporter.sendMail(mailOptions);
  
  // Обновление статуса доставки
  await markDeliveryAsSent(delivery.id);
};

const sendPushNotification = async (delivery: NotificationDelivery) => {
  // TODO: implement push notification
  console.log(`[PUSH] Sending notification to user ${delivery.userId}: ${delivery.notification.title}`);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  await markDeliveryAsSent(delivery.id);
};

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
        console.error(`Delivery with ID ${deliveryId} not found`);
      }
    }
    throw error;
  }
};

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
        console.error(`Delivery with ID ${deliveryId} not found`);
      }
    }
    console.error(`Failed to update delivery status ${deliveryId}:`, error);
  }
};

export const sendEventNotification = async (
  eventId: number,
  title: string,
  content: string,
  userIds: number[]
) => {
  try {
    // get notification type "EVENT" 
    const notificationType = await prisma.notificationType.findFirst({
      where: { name: 'EVENT' }
    });
    
    if (!notificationType) {
      throw new Error('Notification type EVENT not found');
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
    
    // get all notification channels
    const channels = await prisma.notificationChannel.findMany();
    
    // create delivery records for each user
    for (const userId of userIds) {
      // check user preferences
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
      
      // if user has no preferences or all are disabled, skip
      if (userPreferences.length === 0) {
        continue;
      }
      
      // create delivery records for each channel
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
    
    // run deliveries processing
    return processNotificationDeliveries();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Prisma error sending event notification: ${error.code}`, error);
    } else if (error instanceof Error) {
      console.error('Error sending event notification:', error.message);
    } else {
      console.error('Unknown error sending event notification');
    }
    throw error;
  }
};

export const sendAchievementNotification = async (
  userId: number,
  achievementId: number,
  achievementName: string
) => {
  try {
    // get notification type "ACHIEVEMENT"
    const notificationType = await prisma.notificationType.findFirst({
      where: { name: 'ACHIEVEMENT' }
    });
    
    if (!notificationType) {
      throw new Error('Notification type ACHIEVEMENT not found');
    }
    
    // create notification
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
    
    // check user preferences
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
    
    // if user has no preferences, get all channels
    const channels = userPreferences.length > 0
      ? userPreferences
      : await prisma.notificationChannel.findMany().then(channels => 
          channels.map(channel => ({ notificationChannelId: channel.id }))
        );
    
    // create delivery records for each channel
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
    // run deliveries processing
    return processNotificationDeliveries();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Prisma error sending achievement notification: ${error.code}`, error);
    } else if (error instanceof Error) {
      console.error('Error sending achievement notification:', error.message);
    } else {
      console.error('Unknown error sending achievement notification');
    }
    throw error;
  }
}; 