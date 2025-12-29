import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import kycRoutes from './routes/kyc.routes';
import { EnvValidator, ENV_CONFIGS } from '../../shared/utils/env-validator';

// Validate environment variables before starting
EnvValidator.validate(ENV_CONFIGS.COMPLIANCE_SERVICE);

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/kyc', kycRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'compliance-service' });
});

app.listen(PORT, () => {
  console.log(`🔒 Compliance service running on port ${PORT}`);
});
