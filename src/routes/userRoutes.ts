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

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: ID пользователя
 *         email:
 *           type: string
 *           description: Email пользователя
 *         name:
 *           type: string
 *           description: Имя пользователя
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания пользователя
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата обновления пользователя
 *       example:
 *         id: 1
 *         email: user@example.com
 *         name: John Doe
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Создать нового пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Неверные данные
 *       500:
 *         description: Ошибка сервера
 */
router.post('/', createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', auth, getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:id', auth, getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Обновить данные пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID пользователя
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Данные пользователя обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Неверные данные
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
router.patch('/:id', auth, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь удален
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
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