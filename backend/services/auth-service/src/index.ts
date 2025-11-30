import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
});

app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Auth Service running on port ${PORT}`);
});

export default app;
