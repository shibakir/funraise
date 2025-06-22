const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'some_secret_key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key';

const generateToken = (user) => {

    //console.log("generate ACCESS token");
    const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '10s' });
};

const generateRefreshToken = (user) => {

    //console.log("generate REFRESH token");
    const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
    };

    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {

    //console.log("verify token: ",token);
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
};

const verifyRefreshToken = (token) => {

    //console.log("verify refresh token: ",token);
    try {
        return jwt.verify(token, REFRESH_SECRET);
    } catch (e) {
        return null;
    }
};

module.exports = { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken };