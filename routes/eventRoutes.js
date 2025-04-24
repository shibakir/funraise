const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');

// Настройка multer для обработки загрузки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // ограничение 5MB
  },
  fileFilter: (req, file, cb) => {
    // Проверяем тип файла
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Применяем middleware аутентификации ко всем маршрутам
//router.use(authenticateToken);

// Маршрут для получения всех событий
router.get('/', eventController.getAllEvents);

// Маршрут для создания нового события
// Используем upload.single для обработки одного файла с полем 'image'
router.post('/', upload.single('image'), eventController.createEvent);

// Маршрут для получения события по ID
router.get('/:id', eventController.getEventById);

// Маршрут для получения условий окончания события по ID события
router.get('/:id/conditions', eventController.getEventEndConditions);

// Маршрут для получения текущего банка события по ID события
router.get('/:id/bank', eventController.getEventBankAmount);

// Маршрут для обновления события
//router.put('/:id', eventController.updateEvent);

// Маршрут для удаления события
//router.delete('/:id', eventController.deleteEvent);

module.exports = router; 