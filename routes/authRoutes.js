const express = require('express');
//const bcrypt = require('bcrypt');
//const prismaClient = require('@prisma/client').PrismaClient;
//const jwtUtils = require('../utils/jwtUtils');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

module.exports = router;