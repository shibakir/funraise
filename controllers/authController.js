const authService = require('../services/authService');

class AuthController {
    async login (req, res) {
        try {
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
        }  catch (error) {

        }
    };

    async register (req, res) {
        try {
            const { email, username, password } = req.body;
            const userData = await authService.register(email, username, password);

            res.cookie('refreshToken', userData.refreshToken, {maxAge: 15*24*60*60*1000, httpOnly: true})

            return res.status(201).json(userData)

        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.message === 'This username or email is already in use') {
                return res.status(400).json({ message: error.message });
            }
            
            return res.status(500).json({ message: 'Registration error' });
        }
    };

    async logout (req, res) {
        try {

        } catch (error) {

        }
    }

    async activate (req, res) {
        try {
            const activationLink = req.params.link;
            await authService.activate(activationLink);
            res.redirect('https://www.seznam.cz');
        } catch (error) {
            console.error('Activation error:', error);
        }
    }

    async refresh (req, res) {
        try {

        } catch (error) {

        }
    }
}

module.exports = new AuthController();

