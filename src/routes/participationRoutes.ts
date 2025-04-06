import express from 'express';
import {
    createParticipation,
    getUserParticipations,
    getEventParticipations,
    getParticipationById,
    deleteParticipation,
    increaseParticipationDeposit
} from '../controllers/participationController';

const router = express.Router();

// PARTICIPATION ROUTES
router.post('/', createParticipation);
router.get('/user/:userId', getUserParticipations);
router.get('/event/:eventId', getEventParticipations);
router.get('/:id', getParticipationById);
router.patch('/:id/deposit/increase', increaseParticipationDeposit);
router.delete('/:id', deleteParticipation);

export default router; 