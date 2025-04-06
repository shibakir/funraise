import express from 'express';
import { login, register } from '../controllers/authController';

const router = express.Router();

// Login user
router.post('/login', login);

// Register new user
router.post('/register', register);

export default router; 