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
    service: 'recommendation-service',
    timestamp: new Date().toISOString()
  });
});

// TODO: Implement recommendation endpoints
app.get('/api/recommendations/:userId', (req, res) => {
  res.json({ message: 'Recommendation service - TODO: Implement user recommendations' });
});

app.get('/api/recommendations/product/:productId', (req, res) => {
  res.json({ message: 'Recommendation service - TODO: Implement product recommendations' });
});

app.listen(PORT, () => {
  console.log(`Recommendation service running on port ${PORT}`);
});