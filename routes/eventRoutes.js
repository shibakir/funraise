const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Применяем middleware аутентификации ко всем маршрутам
//router.use(authenticateToken);

// Маршрут для получения всех событий
router.get('/', eventController.getAllEvents);

// Маршрут для получения события по ID
router.get('/:id', eventController.getEventById);

// Маршрут для создания нового события
router.post('/', eventController.createEvent);

// Маршрут для обновления события
router.put('/:id', eventController.updateEvent);

// Маршрут для удаления события
//router.delete('/:id', eventController.deleteEvent);

module.exports = router; 