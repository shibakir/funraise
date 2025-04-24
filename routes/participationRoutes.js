const express = require('express');
const router = express.Router();
const participationController = require('../controllers/participationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Применяем middleware аутентификации ко всем маршрутам
//router.use(authenticateToken);

// Маршрут для получения всех участий
router.get('/', participationController.getAllParticipations);

// Маршрут для получения участия по ID
router.get('/:id', participationController.getParticipationById);

// Маршрут для получения участия по ID пользователя и ID события
router.get('/user/:userId/event/:eventId', participationController.getParticipationByUserAndEvent);

// Маршрут для создания нового участия
router.post('/', participationController.createParticipation);

// Маршрут для обновления участия
router.put('/:id', participationController.updateParticipation);

// Маршрут для удаления участия
router.delete('/:id', participationController.deleteParticipation);

module.exports = router; 