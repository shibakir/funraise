import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// routes
import userRoutes from './routes/userRoutes';

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

// routes
app.use('/api/users', userRoutes);

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