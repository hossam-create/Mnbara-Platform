import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

// TODO: Implement order management endpoints
app.get('/api/orders', (req, res) => {
  res.json({ message: 'Order service - TODO: Implement order listing' });
});

app.post('/api/orders', (req, res) => {
  res.json({ message: 'Order service - TODO: Implement order creation' });
});

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});