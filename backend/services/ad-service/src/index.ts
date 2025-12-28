import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import campaignRoutes from './routes/campaign.routes';
import auctionRoutes from './routes/auction.routes';

const app = express();
const PORT = process.env.PORT || 3033;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ads/campaigns', campaignRoutes);
app.use('/api/ads/auction', auctionRoutes);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'ad-service',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`💸 Ad Service running on port ${PORT}`);
});

export default app;
