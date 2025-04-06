import express from 'express';
import {
    createTransaction,
    getUserTransactions,
    getTransactionById,
    getAllTransactions,
    getUserBalance
} from '../controllers/transactionController';

const router = express.Router();

// TRANSACTION ROUTES
router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/user/:userId', getUserTransactions);
router.get('/user/:userId/balance', getUserBalance);
router.get('/:id', getTransactionById);

export default router; 