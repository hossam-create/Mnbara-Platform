import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import productRoutes from './routes/product.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'listing-service' });
});

app.listen(PORT, () => {
  console.log(`Listing service running on port ${PORT}`);
});
