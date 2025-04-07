import express from 'express';
import {
    createEventEndCondition,
    updateEventEndConditionStatus,
    deleteEventEndCondition
} from '../controllers/eventEndConditionController';

import {
    getConditionsByGroup
} from '../controllers/endConditionController';

const router = express.Router();

// EVENT END CONDITION ROUTES
router.post('/', createEventEndCondition);
router.put('/:id', updateEventEndConditionStatus);
router.delete('/:id', deleteEventEndCondition);

// EVENT END CONDITION ROUTES FOR ITS END CONDITIONS 
router.get('/:eventEndConditionId', getConditionsByGroup);

export default router; 