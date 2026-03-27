import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

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

// Order management endpoints
app.get('/api/orders', (req, res) => {
  res.json({ 
    message: 'Order service - order listing endpoint',
    orders: []
  });
});

app.post('/api/orders', (req, res) => {
  res.json({ 
    message: 'Order service - order creation endpoint',
    orderId: 'order-' + Date.now()
  });
});

app.get('/api/orders/:id', (req, res) => {
  res.json({ 
    message: 'Order service - order detail endpoint',
    orderId: req.params.id
  });
});

app.put('/api/orders/:id', (req, res) => {
  res.json({ 
    message: 'Order service - order update endpoint',
    orderId: req.params.id
  });
});

app.delete('/api/orders/:id', (req, res) => {
  res.json({ 
    message: 'Order service - order deletion endpoint',
    orderId: req.params.id
  });
});

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});
