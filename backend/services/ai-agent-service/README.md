# AI Agent Service - LLM Integration

**Port**: 3029  
**Database**: PostgreSQL  
**LLM Providers**: OpenAI, Anthropic Claude

## Overview

AI agent service providing LLM-powered conversational agents with support for multiple models (GPT-4, Claude-3), conversation management, and tool integration. Built for customer support, content generation, data analysis, and custom AI assistants.

## Features

### Agent Management
- Create custom AI agents
- Configure system prompts
- Set temperature and token limits
- Multiple agent types (chatbot, assistant, analyzer, generator)
- Model selection (GPT-4, Claude-3, etc.)

### Conversation Management
- Multi-turn conversations
- Conversation history
- Session tracking
- User association
- Message persistence

### LLM Integration
- OpenAI GPT-4/3.5
- Anthropic Claude-3
- Streaming responses
- Token tracking
- Embeddings generation

### Tool Support
- Function calling
- Custom tools
- API integrations
- Extensible architecture

## API Endpoints

### Agents (6 endpoints)
```
POST   /api/agents              - Create agent
GET    /api/agents              - List agents
GET    /api/agents/:agentId     - Get agent
PUT    /api/agents/:agentId     - Update agent
DELETE /api/agents/:agentId     - Delete agent
POST   /api/agents/chat         - Chat with agent
```

### Conversations (3 endpoints)
```
GET    /api/conversations                  - List conversations
GET    /api/conversations/:conversationId  - Get conversation
DELETE /api/conversations/:conversationId  - Delete conversation
```

### Tools (1 endpoint)
```
GET    /api/tools               - List tools
```

**Total**: 10 API endpoints

## Setup

### 1. Environment Variables
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/ai_agent_db
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
PORT=3029
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration
```bash
npm run migrate
```

### 4. Start Service
```bash
npm run dev
```

## Usage Examples

### Create Agent
```typescript
POST /api/agents
{
  "name": "Customer Support Bot",
  "type": "chatbot",
  "model": "gpt-4",
  "systemPrompt": "You are a helpful customer support agent for Mnbara marketplace. Be friendly, professional, and solve customer issues efficiently.",
  "temperature": 0.7,
  "maxTokens": 2000,
  "config": {
    "language": "en",
    "tone": "professional"
  }
}
```

### Chat with Agent
```typescript
POST /api/agents/chat
{
  "agentId": "agent123",
  "message": "How do I track my order?",
  "userId": "user456",
  "sessionId": "sess789"
}

Response:
{
  "success": true,
  "data": {
    "conversationId": "conv123",
    "message": "To track your order, go to 'My Orders' in your account dashboard...",
    "tokens": 150
  }
}
```

### Continue Conversation
```typescript
POST /api/agents/chat
{
  "agentId": "agent123",
  "conversationId": "conv123",
  "message": "What if I can't find my order number?",
  "userId": "user456"
}
```

### Get Conversation History
```typescript
GET /api/conversations/conv123

Response:
{
  "success": true,
  "data": {
    "id": "conv123",
    "agent": { "name": "Customer Support Bot", ... },
    "messages": [
      { "role": "user", "content": "How do I track my order?", ... },
      { "role": "assistant", "content": "To track your order...", ... },
      { "role": "user", "content": "What if I can't find...", ... },
      { "role": "assistant", "content": "If you can't find...", ... }
    ]
  }
}
```

## Database Schema

### Agent
- Agent configuration
- Model selection
- System prompt
- Temperature/tokens
- Custom config

### Conversation
- Agent association
- User/session tracking
- Metadata
- Timestamps

### Message
- Conversation history
- Role (user/assistant/system)
- Content
- Token count

### Tool
- Tool definitions
- Parameters
- Handler configuration

## Agent Types

### Chatbot
- Customer support
- FAQ answering
- General conversation

### Assistant
- Task completion
- Information retrieval
- Guided workflows

### Analyzer
- Data analysis
- Sentiment analysis
- Content moderation

### Generator
- Content creation
- Product descriptions
- Marketing copy

## LLM Models

### OpenAI
- `gpt-4`: Most capable, best for complex tasks
- `gpt-4-turbo`: Faster, cost-effective
- `gpt-3.5-turbo`: Fast, economical

### Anthropic Claude
- `claude-3-opus`: Most capable
- `claude-3-sonnet`: Balanced
- `claude-3-haiku`: Fast, economical

## Common Use Cases

### Customer Support
```typescript
const agent = await createAgent({
  name: 'Support Bot',
  type: 'chatbot',
  model: 'gpt-4',
  systemPrompt: 'You are a customer support agent...'
});
```

### Content Generator
```typescript
const agent = await createAgent({
  name: 'Product Description Writer',
  type: 'generator',
  model: 'claude-3-sonnet',
  systemPrompt: 'Generate compelling product descriptions...'
});
```

### Data Analyzer
```typescript
const agent = await createAgent({
  name: 'Review Analyzer',
  type: 'analyzer',
  model: 'gpt-4',
  systemPrompt: 'Analyze customer reviews and extract insights...'
});
```

## Best Practices

### System Prompts
- Be specific and clear
- Include role definition
- Set tone and style
- Provide examples
- Define boundaries

### Temperature
- 0.0-0.3: Factual, deterministic
- 0.4-0.7: Balanced creativity
- 0.8-1.0: Creative, varied

### Token Management
- Monitor usage
- Set appropriate limits
- Truncate long conversations
- Implement cost controls

### Conversation Management
- Clean up old conversations
- Implement session timeouts
- Archive inactive chats
- Respect user privacy

## Integration Examples

### Customer Support Integration
```typescript
// Create support agent
const supportAgent = await createAgent({
  name: 'Mnbara Support',
  type: 'chatbot',
  model: 'gpt-4',
  systemPrompt: `You are Mnbara's customer support agent...`
});

// Handle customer query
const response = await chat({
  agentId: supportAgent.id,
  message: customerQuery,
  userId: customerId
});
```

### Product Description Generator
```typescript
// Create generator agent
const descriptionAgent = await createAgent({
  name: 'Product Writer',
  type: 'generator',
  model: 'claude-3-sonnet',
  systemPrompt: 'Generate SEO-optimized product descriptions...'
});

// Generate description
const response = await chat({
  agentId: descriptionAgent.id,
  message: `Generate description for: ${productDetails}`
});
```

## Monitoring

### Key Metrics
- Token usage per agent
- Response latency
- Conversation length
- Error rates
- Cost tracking

### Health Checks
- LLM API connectivity
- Database connection
- Token limits
- Rate limits

## Dependencies

- `openai`: OpenAI Node.js SDK
- `@anthropic-ai/sdk`: Anthropic Claude SDK
- `langchain`: LLM framework
- `@prisma/client`: Database ORM
- `express`: Web framework
- `winston`: Logging

## Port

Service runs on port **3029**

## License

MIT
