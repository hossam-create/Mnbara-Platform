import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import secondLifeRoutes from './routes/secondLife.routes';
import carbonRoutes from './routes/carbon.routes';
import sustainabilityRoutes from './routes/sustainability.routes';
import ecoProductRoutes from './routes/ecoProduct.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sustainability-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/second-life', secondLifeRoutes);
app.use('/api/v1/carbon', carbonRoutes);
app.use('/api/v1/sustainability', sustainabilityRoutes);
app.use('/api/v1/eco-products', ecoProductRoutes);

const PORT = process.env.PORT || 3029;

app.listen(PORT, () => {
  console.log(`🌱 Sustainability Service running on port ${PORT}`);
  console.log(`♻️  Second Life Marketplace ready`);
  console.log(`🌍 Carbon Footprint tracking active`);
});

export default app;
