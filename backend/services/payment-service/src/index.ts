import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import paymentRoutes from './routes/payment.routes';
import walletRoutes from './routes/wallet.routes';
import escrowRoutes from './routes/escrow.routes';
import balanceRoutes from './routes/balance.routes';
import disputeRoutes from './routes/dispute.routes';
import ratingRoutes from './routes/rating.routes';
import behaviorAnalysisRoutes from './routes/ai-behavior-analysis.routes';
import trustScoreRoutes from './routes/trust-score.routes';
import aiOpsMonitoringRoutes from './routes/ai-ops-monitoring.routes';
import { errorHandler } from './middleware/errorHandler';
import { EventPublisher } from './services/event-publisher.service';
import { BalanceVerificationService } from './services/balance-verification.service';
import { WithdrawalProcessor } from './services/withdrawal-processor.service';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3004;

// Initialize RabbitMQ connection
EventPublisher.connect().catch(err => {
    console.warn('RabbitMQ connection failed (will retry):', err.message);
});

// Middleware
app.use(helmet());
app.use(cors());

// Parse JSON for all routes except Stripe webhook (needs raw body)
app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/payments/webhook/stripe') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'payment-service',
        version: '1.0.0',
        providers: {
            stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
            paypal: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'not_configured',
            paymob: process.env.PAYMOB_API_KEY ? 'configured' : 'not_configured'
        },
        features: ['payment_intents', 'webhooks', 'escrow', 'wallet_ledger'],
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/ai/behavior', behaviorAnalysisRoutes);
app.use('/api/trust-score', trustScoreRoutes);
app.use('/api/ai/ops', aiOpsMonitoringRoutes);

// Error handling
app.use(errorHandler);

// Cron job to clean up expired authorizations (runs every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(async () => {
    try {
        const result = await BalanceVerificationService.cleanupExpiredAuthorizations();
        if (result.voided > 0) {
            console.log(`[Balance] Cleaned up ${result.voided} expired authorizations`);
        }
        if (result.errors.length > 0) {
            console.error('[Balance] Cleanup errors:', result.errors);
        }
    } catch (error) {
        console.error('[Balance] Error during authorization cleanup:', error);
    }
}, CLEANUP_INTERVAL);

// Background worker: process wallet withdrawals (every 30 seconds)
const WITHDRAWAL_INTERVAL = 30 * 1000;
setInterval(async () => {
    try {
        await WithdrawalProcessor.processPending(20);
    } catch (error) {
        console.error('[Withdrawal] Error during processing:', error);
    }
}, WITHDRAWAL_INTERVAL);

app.listen(PORT, () => {
    console.log(`🚀 Payment Service running on port ${PORT}`);
    console.log(`   - Stripe: ${process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`   - PayPal: ${process.env.PAYPAL_CLIENT_ID ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`   - Paymob: ${process.env.PAYMOB_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
    console.log('   - Balance verification: ✓ Enabled');
    console.log('   - Authorization cleanup: ✓ Running (every 5 minutes)');
});

export default app;
