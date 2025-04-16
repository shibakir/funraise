const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');

const app = express();
const prisma = new PrismaClient();

// Настройка multer для обработки загрузки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // ограничение 5MB
  },
});

// middleware
app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// add routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const participationRoutes = require('./routes/participationRoutes');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/events', eventRoutes);
app.use('/participations', participationRoutes);

// Middleware для обработки 404 ошибок
app.use((req, res, next) => {
    res.status(404).json({ message: 'Маршрут не найден' });
});

// Middleware для обработки остальных ошибок
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ message: 'Ошибка на сервере' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
