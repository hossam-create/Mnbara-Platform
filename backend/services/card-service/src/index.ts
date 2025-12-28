import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3020; // 3020 for Card Service

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes (Inline for simplicity or split later)
import { generateCard, getMyCards, processTransaction } from './controllers/card.controller';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'card-service' });
});

app.post('/api/cards/issue', generateCard);
app.get('/api/cards', getMyCards);
app.post('/api/cards/:cardId/transact', processTransaction); // Webhook simulation

app.listen(PORT, () => {
  console.log(`💳 Card Service running on port ${PORT}`);
});

export { prisma };
