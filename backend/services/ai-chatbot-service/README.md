# AI Chatbot Service - خدمة الدردشة الذكية

24/7 AI-powered customer support chatbot with multi-language support.

## Port: 3025

## Features | المميزات

### 💬 Conversation Management
- Multi-channel support (Web, Mobile, WhatsApp, Facebook, Instagram, Email)
- Session-based conversations for anonymous users
- Conversation history and context
- Automatic escalation to human agents

### 🎯 Intent Detection
- NLP-based intent recognition
- Configurable confidence thresholds
- Training phrases in Arabic and English
- Custom response templates

### 📚 Knowledge Base
- Searchable FAQ articles
- Bilingual content (AR/EN)
- Helpful/Not helpful feedback
- Category organization

### 👨‍💼 Agent Management
- Agent status tracking (Online, Busy, Away, Offline)
- Workload balancing
- Performance metrics
- Specialization routing

### 📊 Analytics
- Real-time dashboard
- Sentiment analysis
- Intent statistics
- Resolution rates

## API Endpoints

### Chat
```
POST   /api/chat/conversations          - Create conversation
GET    /api/chat/conversations/:id      - Get conversation
GET    /api/chat/users/:userId          - Get user conversations
POST   /api/chat/conversations/:id/messages - Send message
POST   /api/chat/conversations/:id/close    - Close conversation
POST   /api/chat/conversations/:id/rate     - Rate conversation
POST   /api/chat/conversations/:id/escalate - Escalate to agent
```

### Intents
```
GET    /api/intents                     - List intents
GET    /api/intents/:id                 - Get intent
POST   /api/intents                     - Create intent
PUT    /api/intents/:id                 - Update intent
DELETE /api/intents/:id                 - Delete intent
POST   /api/intents/:id/responses       - Add response
```

### Knowledge Base
```
GET    /api/knowledge                   - List articles
GET    /api/knowledge/search            - Search articles
GET    /api/knowledge/:id               - Get article
POST   /api/knowledge                   - Create article
PUT    /api/knowledge/:id               - Update article
DELETE /api/knowledge/:id               - Delete article
POST   /api/knowledge/:id/feedback      - Submit feedback
```

### Agents
```
GET    /api/agents                      - List agents
GET    /api/agents/:id                  - Get agent
POST   /api/agents                      - Create agent
PUT    /api/agents/:id                  - Update agent
PATCH  /api/agents/:id/status           - Update status
GET    /api/agents/:id/stats            - Get agent stats
```

### Analytics
```
GET    /api/analytics/dashboard         - Dashboard stats
GET    /api/analytics/metrics           - Metrics over time
GET    /api/analytics/intents           - Intent statistics
GET    /api/analytics/sentiment         - Sentiment analysis
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/chatbot
REDIS_URL=redis://localhost:6379
PORT=3025
```

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Tech Stack
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Redis for caching
- WebSocket for real-time chat
