import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import travelerRoutes from './routes/traveler.routes';
import deliveryRoutes from './routes/delivery.routes';
import shopperRequestRoutes from './routes/shopper-request.routes';
import offerRoutes from './routes/offer.routes';
import matchingRoutes from './routes/matching.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'crowdship-service' });
});

app.use('/api/travelers', travelerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/shopper-requests', shopperRequestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/matching', matchingRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Crowdship Service running on port ${PORT}`);
});

export default app;
