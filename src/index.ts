import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import middleware from 'i18next-http-middleware';
import './config/i18n';

// routes
import userRoutes from './routes/userRoutes';
import transactionRoutes from './routes/transactionRoutes';
import eventRoutes from './routes/eventRoutes';
import participationRoutes from './routes/participationRoutes';
import achievementRoutes from './routes/achievementRoutes';
import authRoutes from './routes/authRoutes';

// config
dotenv.config();
const app = express();
const prisma = new PrismaClient({
  errorFormat: 'minimal',
});
const PORT = process.env.PORT || 3000;

// test db connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Success connection to db');
  } catch (error) {
    console.error('Error connection to db', error);
  }
}

testDatabaseConnection();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(middleware.handle);

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/achievements', achievementRoutes);

// errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// run
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

// off
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma off');
  process.exit(0);
});

export { prisma }; 