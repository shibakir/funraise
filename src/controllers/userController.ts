import { Request, Response } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: req.t('user.create.fieldsRequired') });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: req.t('user.create.userExists') });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      }
    });

    // send the user without the password in the response
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      ...userWithoutPassword,
      message: req.t('user.create.success')
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: req.t('user.create.error') });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        password: false // exclude password
      }
    });
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: req.t('user.getAll.error') });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        password: false, // exclude password from selection
      }
    });

    if (!user) {
      return res.status(404).json({ error: req.t('user.get.notFound') });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: req.t('user.get.error') });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, password } = req.body;

    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: Number(id) }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: req.t('user.update.userExists') });
      }
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(email && { email }),
        ...(name !== undefined && { name }),
        ...(password && { password: hashedPassword }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        password: false, // exclude password from selection
      }
    });

    return res.json({
      ...updatedUser,
      message: req.t('user.update.success')
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: req.t('user.update.error') });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return res.status(404).json({ error: req.t('user.delete.notFound') });
    }

    await prisma.user.delete({
      where: { id: Number(id) }
    });

    return res.json({ message: req.t('user.delete.success') });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: req.t('user.delete.error') });
  }
};