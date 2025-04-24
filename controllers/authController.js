const authService = require('../services/authService');

exports.login = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            message: 'Request body is missing'
        });
    }

    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
        return res.status(400).json({
            message: 'The "password" field and one of the "email" or "username" fields must be provided.',
        });
    }

    try {
        const { user, token } = await authService.authenticate({ email, username, password });
        res.status(200).json({ user, token });
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.message === 'User not found') {
            return res.status(404).json({ message: 'User not found' });
        } else if (error.message === 'Invalid password') {
            return res.status(401).json({ message: 'Invalid password' });
        }
        
        res.status(500).json({ message: 'Authentication error.' });
    }
};

exports.register = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            message: 'Request body is missing'
        });
    }

    console.log(req.body);
    const { email, username, password } = req.body;


    if (!email || !username || !password) {
        return res.status(400).json({
            message: 'Email, username, and password are required'
        });
    }

    try {
        const { user, token } = await authService.register({ email, username, password });
        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.message === 'Email already in use') {
            return res.status(409).json({ message: 'Email already in use' });
        } else if (error.message === 'Username already in use') {
            return res.status(409).json({ message: 'Username already in use' });
        }
        
        res.status(500).json({ message: 'Registration error.' });
    }
}; 
