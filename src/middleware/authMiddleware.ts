import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

// Extend the Request interface to add the user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name?: string | null;
      };
    }
  }
}

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'this-secret-key-is-not-secure-at-all-do-not-use-it-in-production';

interface JwtPayload {
  userId: number;
  email: string;
}

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * Middleware для проверки аутентификации.
 * Проверяет наличие и валидность JWT токена в заголовке Authorization.
 */
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: req.t('auth.middleware.tokenRequired') });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: req.t('auth.middleware.tokenRequired') });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      return res.status(401).json({ message: req.t('auth.middleware.userNotFound') });
    }

    // Добавляем информацию о пользователе в объект запроса
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: req.t('auth.middleware.invalidToken') });
  }
}; 