const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'some_secret_key';


exports.authenticateToken = (req, res, next) => {
    // Получаем токен из заголовка Authorization

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        // Если токен верифицирован, сохраняем информацию о пользователе в req.user
        req.user = user;
        next();
    });
};
