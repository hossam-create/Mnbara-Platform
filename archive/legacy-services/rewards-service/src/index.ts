import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cron from 'node-cron';
import loyaltyRoutes from './routes/loyalty.routes';
import { LoyaltyService } from './services/loyalty.service';
import { GamificationService } from './services/gamification.service';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3008;

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        service: 'loyalty-service',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/loyalty', loyaltyRoutes);

// ============================================
// SCHEDULED TASKS
// ============================================

// Process points expiration daily at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily points expiration job...');
    try {
        const loyaltyService = new LoyaltyService();
        const result = await loyaltyService.processExpirations();
        console.log(`Processed ${result.processed} expirations`);
    } catch (error) {
        console.error('Error processing expirations:', error);
    }
});

// Initialize achievements and tiers on startup
const initializeData = async () => {
    try {
        const gamificationService = new GamificationService();
        
        // Initialize tiers
        await gamificationService.initializeTiers();
        console.log('Tiers initialized');
        
        // Initialize achievements
        await gamificationService.initializeAchievements();
        console.log('Achievements initialized');
        
    } catch (error) {
        console.error('Error initializing data:', error);
    }
};

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: Request, res: Response, next: any) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: err.message,
        service: 'loyalty-service'
    });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
    try {
        // Initialize data
        await initializeData();
        
        app.listen(PORT, () => {
            console.log(`🎁 Loyalty Service running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API: http://localhost:${PORT}/api/loyalty`);
            console.log(`⏰ Daily expiration job scheduled`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
