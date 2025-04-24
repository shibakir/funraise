const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Используем authenticateToken для всех маршрутов
//router.use(authenticateToken);

/**
 * @route   GET /transactions
 * @desc    Получение всех транзакций
 */
router.get('/', transactionController.getAllTransactions);

/**
 * @route   GET /transactions/:id
 * @desc    Получение транзакции по ID
 */
router.get('/:id', transactionController.getTransactionById);

/**
 * @route   POST /transactions
 * @desc    Создание новой транзакции для текущего пользователя
 */
router.post('/', transactionController.createTransaction);

module.exports = router; 