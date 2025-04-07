import express from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
} from '../controllers/eventController';

import {
    getEventEndConditions
} from '../controllers/eventEndConditionController';

const router = express.Router();

// EVENT ROUTES
router.post('/', createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

// EVENT END CONDITION ROUTES
router.get('/:eventId/end-conditions', getEventEndConditions);

export default router; 