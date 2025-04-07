import express from 'express';
import { auth } from '../middleware/authMiddleware';

import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../controllers/userController';

import {
    getUserAchievements,
    getUserAchievementById,
    initUserAchievement,
    updateCriterionProgress,
    //checkAndUpdateProgressByType
} from '../controllers/userAchievementController';

import {
    getUserNotifications,
    //markAllNotificationsAsRead
} from '../controllers/notificationController';

import {
    getUserNotificationPreferences,
    setUserNotificationPreference,
    getUserNotificationPreferenceStatus,
    deleteUserNotificationPreference,
    initUserNotificationPreferences
} from '../controllers/userNotificationPreferenceController';

import {
    getUserTransactions,
    getUserBalance
} from '../controllers/transactionController';

import {
    getUserEvents
} from '../controllers/eventController';

const router = express.Router();

router.post('/', createUser);
router.get('/', auth, getAllUsers);
router.get('/:id', auth, getUserById);
router.patch('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);

// USER ACHIEVEMENTS ROUTES
router.get('/:id/achievements', getUserAchievements);
router.get('/:id/achievements/:achievementId', getUserAchievementById);
router.post('/:id/achievements', initUserAchievement);
router.patch('/:id/progress/:progressId', updateCriterionProgress);
//router.post('/:id/achievements/check-progress', checkAndUpdateProgressByType);

// USER NOTIFICATIONS ROUTES
router.get('/:id/notifications', getUserNotifications);
//router.patch('/:id/notifications/read-all', markAllNotificationsAsRead);

// USER NOTIFICATION PREFERENCES ROUTES
router.get('/:userId/notification-preferences', getUserNotificationPreferences);
router.post('/:userId/notification-preferences', setUserNotificationPreference);
router.get('/:userId/notification-preferences/types/:typeId/channels/:channelId', getUserNotificationPreferenceStatus);
router.delete('/:userId/notification-preferences/:preferenceId', deleteUserNotificationPreference);
router.post('/:userId/notification-preferences', initUserNotificationPreferences);

// USER TRANSACTIONS ROUTES
router.get('/:userId/transactions', getUserTransactions);
router.get('/:userId/balance', getUserBalance); // ? TODO

// USER EVENTS ROUTES
router.get('/:userId/events', getUserEvents);

export default router; 