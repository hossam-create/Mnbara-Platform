import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agentRoutes from './routes/agent.routes';
import conversationRoutes from './routes/conversation.routes';
import toolRoutes from './routes/tool.routes';
import shoppingAssistantRoutes from './routes/shopping-assistant.routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3028;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/shopping-assistant', shoppingAssistantRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-agent-service' });
});

app.listen(PORT, () => {
  logger.info(`AI Agent Service running on port ${PORT}`);
});
