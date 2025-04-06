import express from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    getUserEvents,
    updateEvent,
    deleteEvent
} from '../controllers/eventController';

const router = express.Router();

// EVENT ROUTES
router.post('/', createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/user/:userId', getUserEvents);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router; 