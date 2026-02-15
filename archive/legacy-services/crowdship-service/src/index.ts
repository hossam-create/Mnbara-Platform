import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crowdshipRoutes from './routes/crowdship.routes';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/crowdship', crowdshipRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'crowdship-service' });
});

app.listen(PORT, () => {
  console.log(`Crowdship service running on port ${PORT}`);
});
