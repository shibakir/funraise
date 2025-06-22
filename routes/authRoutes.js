const express = require('express');
const { userService } = require('../service');

const router = express.Router();

/**
 * User activation endpoint
 * Handles GET requests to activate user accounts via email links
 */
router.get('/activate/:activationLink', async (req, res) => {
    try {
        const { activationLink } = req.params;
        
        // Activate user through UserService
        const user = await userService.activate(activationLink);
        
        // Send success response with HTML page
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Account activation - Funraise</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
                    .username { color: #007bff; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="success">✅ Your account has been activated!</h1>
                    <p>Welcome, <span class="username">${user.username}</span>!</p>
                    <p>Your account has been successfully activated. You can now login to Funraise.</p>
                    <p>You can close this page.</p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Activation error:', error);
        
        // Send error response with HTML page
        res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Activation error - Funraise</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="error">❌ Activation error</h1>
                    <p>${error.message || 'An error occurred while activating the account'}</p>
                    <p>Possible reasons:</p>
                    <ul style="text-align: left;">
                        <li>Activation link is invalid or expired</li>
                        <li>Account has already been activated</li>
                        <li>Technical error occurred</li>
                    </ul>
                    <p>Please try requesting a new activation link or contact support :-).</p>
                </div>
            </body>
            </html>
        `);
    }
});

module.exports = router; 