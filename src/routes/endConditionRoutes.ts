import express from 'express';
import {
    createEndCondition,
    updateEndCondition,
    deleteEndCondition,
} from '../controllers/endConditionController';

const router = express.Router();

// END CONDITION ROUTES
router.post('/', createEndCondition);
router.put('/:id', updateEndCondition);
router.delete('/:id', deleteEndCondition);

export default router; 