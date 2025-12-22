import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import listingRoutes from './routes/listing.routes';
import categoryRoutes from './routes/category.routes';
import feeRoutes from './routes/fee.routes';
import resaleRoutes from './routes/resale.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'listing-service' });
});

app.use('/api/listings', listingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/resale-listings', resaleRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Listing Service running on port ${PORT}`);
});

export default app;
