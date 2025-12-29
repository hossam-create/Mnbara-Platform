import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import paymentRoutes from './routes/payment.routes';
import { EnvValidator, ENV_CONFIGS, validateProductionSecrets } from '../../shared/utils/env-validator';

// Validate environment variables before starting
EnvValidator.validate(ENV_CONFIGS.PAYMENT_SERVICE);
validateProductionSecrets();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});

app.listen(PORT, () => {
  console.log(`💳 Payment service running on port ${PORT}`);
});
