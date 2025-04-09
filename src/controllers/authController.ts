import { Request, Response } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'this-secret-key-is-not-secure-at-all-do-not-use-it-in-production';
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

export const login = async (req: Request, res: Response) => {
  const t = req.t; // translation function

  try {
    const { email, password } = req.body;

    console.log('login123', email, password);

    if (!email || !password) {
      return res.status(400).json({ message: t('auth.login.fieldsRequired') });
    }

    console.log('login456');

    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log('login789', user);

    if (!user) {
      return res.status(401).json({ message: t('auth.login.invalidCredentials') });
    }

    if (!user.password) {
      return res.status(401).json({ message: t('auth.login.otherAuthMethod') });
    }

    console.log('login1011', user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: t('auth.login.invalidCredentials') });
    }

    console.log('login1213', isPasswordValid);

    // create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // send token to client
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
      message: t('auth.login.success')
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: t('auth.login.error') });
  }
};

export const register = async (req: Request, res: Response) => {
  const t = req.t; // translation function

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: t('auth.register.fieldsRequired') });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: t('auth.register.userExists') });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // send token to client
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
      message: t('auth.register.success')
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: t('auth.register.error') });
  }
}; 