const transactionService = require('../services/transactionService');

/**
 * Контроллер для управления транзакциями
 */
const transactionController = {
    /**
     * Получение всех транзакций
     * @param {Object} req - Запрос
     * @param {Object} res - Ответ
     * @returns {Promise<void>}
     */
    async getAllTransactions(req, res) {
        try {
            const transactions = await transactionService.getAllTransactions();
            res.status(200).json(transactions);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    
    /**
     * Получение транзакций пользователя
     * @param {Object} req - Запрос
     * @param {Object} res - Ответ
     * @returns {Promise<void>}
     */
    async getUserTransactions(req, res) {
        try {
            const { userId } = req.params;
            const transactions = await transactionService.getUserTransactions(userId);
            res.status(200).json(transactions);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    
    /**
     * Получение транзакции по ID
     * @param {Object} req - Запрос
     * @param {Object} res - Ответ
     * @returns {Promise<void>}
     */
    async getTransactionById(req, res) {
        try {
            const { id } = req.params;
            const transaction = await transactionService.getTransactionById(id);
            
            // Проверка, принадлежит ли транзакция текущему пользователю или админу
            if (transaction.userId !== req.user.id) {
                return res.status(403).json({ message: 'Access denied. Not your transaction.' });
            }
            
            res.status(200).json(transaction);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    },
    
    /**
     * Создание новой транзакции
     * @param {Object} req - Запрос
     * @param {Object} res - Ответ
     * @returns {Promise<void>}
     */
    async createTransaction(req, res) {
        try {
            const { amount } = req.body;
            
            if (!amount) {
                return res.status(400).json({ message: 'Amount is required' });
            }
            
            // Используем ID пользователя из токена
            //const userId = req.user.id;
            const userId = 1; // TODO: IN production use req.user.id
            
            const newTransaction = await transactionService.createTransaction({
                amount,
                userId
            });
            
            res.status(201).json(newTransaction);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = transactionController; 