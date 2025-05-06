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

// Маршрут для получения транзакций пользователя
router.get('/:userId/transactions', authMiddleware, userController.getUserTransactions);

// Route для получения баланса
router.get('/:userId/balance', authMiddleware, userController.getUserBalance);

// Маршрут для создания нового пользователя
//router.post('/', authMiddleware, userController.createUser);

// Маршрут для обновления пользователя
//router.put('/:id', userController.updateUser);

// Маршрут для удаления пользователя
//router.delete('/:id', userController.deleteUser);

// Маршрут для получения достижений пользователя
router.get('/:userId/achievements', authMiddleware, userController.getUserAchievements);

module.exports = router;