/**
 * KYC Service Entry Point
 */

import express from 'express';
import dotenv from 'dotenv';
import kycRoutes from './routes/kyc.routes';
import adminKycRoutes from './routes/admin-kyc.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(express.json());

// Routes
app.use('/kyc', kycRoutes);
app.use('/admin/kyc', adminKycRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kyc-service' });
});

// Start server
app.listen(PORT, () => {
  console.log(`KYC Service running on port ${PORT}`);
});

export default app;
