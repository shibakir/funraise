import express from 'express';

import {
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  updateDeliveryStatus
} from '../controllers/notificationController';

import {
  getAllNotificationTypes,
  getNotificationTypeById,
  createNotificationType,
  updateNotificationType,
  deleteNotificationType
} from '../controllers/notificationTypeController';

import {
  getAllNotificationChannels,
  getNotificationChannelById,
  createNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel
} from '../controllers/notificationChannelController';

const router = express.Router();

// NOTIFICATION ROUTES
router.get('/:id', getNotificationById);
router.post('/', createNotification);
router.patch('/:id/read', markNotificationAsRead); // ? TODO
router.patch('/deliveries/:deliveryId/status', updateDeliveryStatus); // ? TODO

// NOTIFICATION TYPES ROUTES
router.get('/types', getAllNotificationTypes);
router.get('/types/:id', getNotificationTypeById);
router.post('/types', createNotificationType);
router.put('/types/:id', updateNotificationType);
router.delete('/types/:id', deleteNotificationType);

// NOTIFICATION CHANNELS ROUTES
router.get('/channels', getAllNotificationChannels);
router.get('/channels/:id', getNotificationChannelById);
router.post('/channels', createNotificationChannel);
router.put('/channels/:id', updateNotificationChannel);
router.delete('/channels/:id', deleteNotificationChannel);

export default router; 