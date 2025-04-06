import express from 'express';
import {
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  updateDeliveryStatus
} from '../controllers/notificationController';

import {
  getUserNotificationPreferences,
  setUserNotificationPreference,
  deleteUserNotificationPreference,
  getUserNotificationPreferenceStatus,
  initUserNotificationPreferences
} from '../controllers/userNotificationPreferenceController';

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
router.get('/notifications/:id', getNotificationById);
router.post('/notifications', createNotification);
router.patch('/notifications/:id/read', markNotificationAsRead);
router.patch('/deliveries/:deliveryId/status', updateDeliveryStatus);

// USER NOTIFICATION PREFERENCES ROUTES
router.get('/preferences/user/:userId', getUserNotificationPreferences);
router.post('/preferences/user/:userId', setUserNotificationPreference);
router.get('/preferences/user/:userId/type/:typeId/channel/:channelId', getUserNotificationPreferenceStatus);
router.delete('/preferences/:preferenceId', deleteUserNotificationPreference);
router.post('/preferences/user/:userId/init', initUserNotificationPreferences);

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