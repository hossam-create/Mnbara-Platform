# Chat Service

Real-time chat service with Socket.IO for instant messaging, supporting direct messages, group chats, and channels.

## Features

- **Real-time Messaging**: Socket.IO for instant message delivery
- **Conversation Types**: Direct, Group, Channel
- **Message Features**: Edit, delete, reply, reactions
- **Read Receipts**: Track message delivery and read status
- **Typing Indicators**: Real-time typing status
- **Unread Counts**: Track unread messages per conversation
- **Participant Management**: Add/remove participants, roles
- **Message History**: Paginated message loading
- **Authentication**: JWT-based auth for Socket.IO and REST

## Installation

```bash
cd backend/services/chat-service
npm install
```

## Configuration

```bash
cp .env.example .env
```

Configure:
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: JWT secret key (same as auth-service)
- `FRONTEND_URL`: Frontend URL for CORS

## Database Setup

```bash
npx prisma migrate deploy
npx prisma generate
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### REST API

#### Create Conversation
```bash
POST /chat/conversations
Authorization: Bearer {token}

{
  "type": "DIRECT",
  "participantIds": ["user-1", "user-2"]
}
```

#### Get Conversations
```bash
GET /chat/conversations?limit=50
Authorization: Bearer {token}
```

#### Get Messages
```bash
GET /chat/conversations/:id/messages?limit=50&before=2026-02-03T10:00:00Z
Authorization: Bearer {token}
```

#### Get Unread Count
```bash
GET /chat/conversations/:id/unread
Authorization: Bearer {token}
```

### Socket.IO Events

#### Connect
```javascript
const socket = io('http://localhost:3016', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Send Message
```javascript
socket.emit('message:send', {
  conversationId: 'conv-123',
  content: 'Hello!',
  type: 'TEXT',
  tempId: 'temp-123' // For optimistic UI
});

socket.on('message:sent', (data) => {
  console.log('Message sent:', data.message);
});

socket.on('message:new', (message) => {
  console.log('New message:', message);
});
```

#### Edit Message
```javascript
socket.emit('message:edit', {
  messageId: 'msg-123',
  content: 'Updated message'
});

socket.on('message:edited', (message) => {
  console.log('Message edited:', message);
});
```

#### Delete Message
```javascript
socket.emit('message:delete', {
  messageId: 'msg-123'
});

socket.on('message:deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

#### React to Message
```javascript
socket.emit('message:react', {
  messageId: 'msg-123',
  emoji: '👍'
});

socket.on('message:reaction', (data) => {
  console.log('Reaction added:', data);
});
```

#### Mark as Read
```javascript
socket.emit('message:read', {
  conversationId: 'conv-123',
  messageId: 'msg-123'
});

socket.on('message:read', (data) => {
  console.log('Message read:', data);
});
```

#### Typing Indicators
```javascript
socket.emit('typing:start', {
  conversationId: 'conv-123'
});

socket.emit('typing:stop', {
  conversationId: 'conv-123'
});

socket.on('typing:start', (data) => {
  console.log(`${data.userId} is typing...`);
});

socket.on('typing:stop', (data) => {
  console.log(`${data.userId} stopped typing`);
});
```

## Integration Examples

### React Frontend

```typescript
import { io, Socket } from 'socket.io-client';

class ChatClient {
  private socket: Socket;

  constructor(token: string) {
    this.socket = io('http://localhost:3016', {
      auth: { token }
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('message:new', (message) => {
      // Update UI with new message
    });

    this.socket.on('typing:start', (data) => {
      // Show typing indicator
    });
  }

  sendMessage(conversationId: string, content: string) {
    this.socket.emit('message:send', {
      conversationId,
      content,
      tempId: Date.now().toString()
    });
  }

  startTyping(conversationId: string) {
    this.socket.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket.emit('typing:stop', { conversationId });
  }
}
```

### React Native

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3016', {
  auth: { token: userToken },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected to chat');
});

socket.on('message:new', (message) => {
  // Add to message list
  setMessages(prev => [...prev, message]);
});
```

## Database Schema

```prisma
Conversation {
  id, type, name, avatar
  createdBy, lastMessage, lastMessageAt
  participants[], messages[]
}

ConversationParticipant {
  id, conversationId, userId, role
  joinedAt, lastReadAt
  isMuted, isBlocked
}

Message {
  id, conversationId, senderId
  content, type, metadata
  replyToId, isEdited, isDeleted
  reactions[], readReceipts[]
}

MessageReaction {
  id, messageId, userId, emoji
}

MessageReadReceipt {
  id, messageId, userId, readAt
}
```

## Port

Default: **3016**

## Dependencies

- socket.io: Real-time communication
- express: REST API
- @prisma/client: Database ORM
- jsonwebtoken: JWT authentication
- redis: (Optional) Socket.IO scaling

## Architecture

```
src/
├── controllers/
│   └── chat.controller.ts
├── routes/
│   └── chat.routes.ts
├── services/
│   ├── chat.service.ts
│   └── socket.service.ts
├── middleware/
│   └── auth.middleware.ts
├── types/
│   └── chat.types.ts
├── utils/
│   └── logger.ts
└── index.ts
```

## License

MIT
