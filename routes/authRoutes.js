const express = require('express');
const {body} = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register',
    body('email').isEmail(),
    body('password').isLength({min: 3, max: 20}),
    body('username').isLength({min: 2, max: 20}),
    authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/activate/:link', authController.activate);
router.get('/refresh', authController.refresh);

module.exports = router;