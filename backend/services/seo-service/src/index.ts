import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import seoRoutes from './routes/seo.routes';

const app = express();
const PORT = process.env.PORT || 3034;

app.use(helmet());
app.use(cors());

// Routes
app.use('/api/seo', seoRoutes);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'seo-service',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 SEO Service running on port ${PORT}`);
});

export default app;
