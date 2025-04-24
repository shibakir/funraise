const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Применяем middleware аутентификации ко всем маршрутам
//router.use(authenticateToken);

// Маршрут для получения всех пользователей с возможностью поиска
router.get('/', userController.getAllUsers);

// Маршрут для получения пользователя по ID
router.get('/:id', userController.getUserById);

// Маршрут для получения событий пользователя
router.get('/:userId/events', eventController.getUserEvents);

// Маршрут для получения транзакций пользователя
router.get('/:userId/transactions', userController.getUserTransactions);

// Route для получения баланса
router.get('/:userId/balance', userController.getUserBalance);

// Маршрут для создания нового пользователя
router.post('/', userController.createUser);

// Маршрут для обновления пользователя
router.put('/:id', userController.updateUser);

// Маршрут для удаления пользователя
router.delete('/:id', userController.deleteUser);

module.exports = router;