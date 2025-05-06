const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');


// Маршрут для получения всех пользователей с возможностью поиска
router.get('/', authMiddleware, userController.getAllUsers);

// Маршрут для получения пользователя по ID
router.get('/:userId', authMiddleware, userController.getUserById);

// Маршрут для получения событий пользователя
router.get('/:userId/events', authMiddleware, eventController.getUserEvents);

// Route для получения баланса
router.get('/:userId/balance', authMiddleware, userController.getUserBalance);

// Маршрут для обновления пользователя
router.put('/:userId', authMiddleware, userController.updateUser);

// Маршрут для получения достижений пользователя
router.get('/:userId/achievements', authMiddleware, userController.getUserAchievements);

module.exports = router;