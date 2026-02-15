import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import sellerRoutes from './routes/seller.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/sellers', sellerRoutes);
app.use('/api/sellers', productRoutes);
app.use('/api/sellers', inventoryRoutes);
app.use('/api/sellers', analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'seller-service' });
});

app.listen(PORT, () => {
  console.log(`🏪 Seller service running on port ${PORT}`);
});
