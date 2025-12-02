import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rewardsRoutes from './routes/rewards.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'rewards-service' });
});

app.use('/api/rewards', rewardsRoutes);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`🎁 Rewards Service running on port ${PORT}`);
});

export default app;
