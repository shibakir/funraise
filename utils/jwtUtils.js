const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'some_secret_key';

const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };