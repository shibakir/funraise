import express from 'express';
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
}from '../controllers/userController';

const router = express.Router();

// USER ROUTES
router.post('/', createUser);   
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router; 