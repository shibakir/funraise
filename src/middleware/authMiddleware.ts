import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

// Extend the Request interface to add the user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'this-jwt-secret-is-not-secure-at-all-do-not-use-it-in-production';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Need to be authorized' });
    }

    // Check token
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }

      // Add user data to the request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
      
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 