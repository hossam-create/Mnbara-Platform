import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cartRoutes from './routes/cart.routes';
import { EnvValidator, ENV_CONFIGS } from '../../shared/utils/env-validator';

// Validate environment variables before starting
EnvValidator.validate(ENV_CONFIGS.CART_SERVICE);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/cart', cartRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cart-service' });
});

app.listen(PORT, () => {
  console.log(`🛒 Cart service running on port ${PORT}`);
});
