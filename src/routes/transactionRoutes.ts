import express from 'express';
import {
    createTransaction,
    getTransactionById,
    getAllTransactions,
} from '../controllers/transactionController';

const router = express.Router();

// TRANSACTION ROUTES
router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);

export default router; 