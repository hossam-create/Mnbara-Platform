import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3008; // Assign a new port

app.use(cors());
app.use(express.json());

app.use('/api/blockchain', routes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'blockchain-service' });
});

app.listen(port, () => {
    console.log(`Blockchain Service running on port ${port}`);
});
