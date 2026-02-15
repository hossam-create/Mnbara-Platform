# Communication UI - Usage Guide

## Quick Start

### Basic Usage

```tsx
import { MatchChat } from '@/components/p2p-exchange';

function MatchPage() {
  const { match } = useMatch(matchId);
  const { user } = useAuth();

  return (
    <div className="h-screen">
      <MatchChat 
        match={match} 
        currentUserId={user.id}
        className="h-full"
      />
    </div>
  );
}
```

---

## Component API

### MatchChat

Main chat component that combines all messaging functionality.

```tsx
interface MatchChatProps {
  match: ExchangeMatch;        // The exchange match object
  currentUserId: string;        // Current user's ID
  className?: string;           // Optional CSS classes
}
```

**Example**:
```tsx
<MatchChat 
  match={match} 
  currentUserId="user-123"
  className="rounded-lg shadow-lg"
/>
```

---

### MessageList

Display messages in a scrollable list.

```tsx
interface MessageListProps {
  messages: Message[];          // Array of messages
  currentUserId: string;        // Current user's ID
  isLoading?: boolean;          // Loading state
}
```

**Example**:
```tsx
<MessageList 
  messages={messages}
  currentUserId="user-123"
  isLoading={false}
/>
```

---

### MessageInput

Input component for sending messages.

```tsx
interface MessageInputProps {
  onSend: (content: string) => Promise<void>;  // Send handler
  isSending?: boolean;                          // Sending state
  disabled?: boolean;                           // Disabled state
  placeholder?: string;                         // Placeholder text
  maxLength?: number;                           // Max characters
}
```

**Example**:
```tsx
<MessageInput 
  onSend={handleSend}
  isSending={false}
  disabled={false}
  placeholder="اكتب رسالتك..."
  maxLength={1000}
/>
```

---

### useMatchChat Hook

React hook for managing chat state.

```tsx
interface UseMatchChatOptions {
  matchId: string;              // Match ID
  enabled?: boolean;            // Enable/disable hook
  pollingInterval?: number;     // Polling interval in ms
}

interface UseMatchChatReturn {
  messages: Message[];          // All messages
  isLoading: boolean;           // Loading state
  error: Error | null;          // Error state
  sendMessage: (content: string) => Promise<void>;  // Send function
  isSending: boolean;           // Sending state
  hasExternalContact: boolean;  // External contact detected
  flaggedMessages: Message[];   // Flagged messages
  refetch: () => void;          // Manual refetch
}
```

**Example**:
```tsx
const {
  messages,
  isLoading,
  sendMessage,
  isSending,
  hasExternalContact,
} = useMatchChat({
  matchId: 'match-123',
  enabled: true,
  pollingInterval: 3000,
});
```

---

## Features

### 1. Real-Time Messaging

Messages are automatically fetched every 3 seconds:

```tsx
const { messages } = useMatchChat({
  matchId: 'match-123',
  pollingInterval: 3000, // 3 seconds
});
```

### 2. External Contact Detection

Automatically detects and warns about external contact information:

```tsx
// Warning is shown automatically when detected
{hasExternalContact && (
  <div className="warning">
    تحذير: تم اكتشاف معلومات اتصال خارجية
  </div>
)}
```

### 3. Message Flagging

Admin users can flag inappropriate messages:

```tsx
import { communicationApi } from '@/api/p2p-exchange/communication.api';

await communicationApi.flagMessage(messageId, 'Inappropriate content');
```

### 4. Chat Status Management

Chat is automatically disabled for completed/cancelled matches:

```tsx
const isChatDisabled = 
  match.status === 'COMPLETED' ||
  match.status === 'CANCELLED' ||
  match.status === 'FAILED' ||
  match.status === 'EXPIRED';
```

---

## Customization

### Styling

All components use Tailwind CSS and can be customized:

```tsx
<MatchChat 
  match={match}
  currentUserId={userId}
  className="custom-class bg-gray-50 rounded-xl"
/>
```

### Polling Interval

Adjust the polling interval for real-time updates:

```tsx
const { messages } = useMatchChat({
  matchId: 'match-123',
  pollingInterval: 5000, // 5 seconds instead of 3
});
```

### Message Length

Customize the maximum message length:

```tsx
<MessageInput 
  onSend={handleSend}
  maxLength={500} // 500 characters instead of 1000
/>
```

---

## Error Handling

### Display Errors

```tsx
const { error, refetch } = useMatchChat({ matchId });

if (error) {
  return (
    <div className="error">
      <p>فشل تحميل الرسائل: {error.message}</p>
      <button onClick={refetch}>حاول مرة أخرى</button>
    </div>
  );
}
```

### Handle Send Errors

```tsx
const handleSend = async (content: string) => {
  try {
    await sendMessage(content);
  } catch (error) {
    console.error('Failed to send:', error);
    // Show error toast
  }
};
```

---

## Best Practices

### 1. Always Provide Current User ID

```tsx
// ✅ Good
<MatchChat match={match} currentUserId={user.id} />

// ❌ Bad
<MatchChat match={match} currentUserId="" />
```

### 2. Handle Loading States

```tsx
const { messages, isLoading } = useMatchChat({ matchId });

if (isLoading) {
  return <LoadingSpinner />;
}

return <MessageList messages={messages} />;
```

### 3. Validate Before Sending

```tsx
const handleSend = async (content: string) => {
  if (!content.trim()) {
    return; // Don't send empty messages
  }
  
  await sendMessage(content);
};
```

### 4. Clean Up on Unmount

```tsx
useEffect(() => {
  return () => {
    // Cleanup if needed
  };
}, []);
```

---

## Security Considerations

### 1. Never Share External Contact

The system automatically detects and warns about:
- Phone numbers
- Email addresses
- Social media handles
- URLs

### 2. Report Inappropriate Content

Users should report inappropriate messages:

```tsx
<button onClick={() => reportMessage(messageId)}>
  الإبلاغ عن الرسالة
</button>
```

### 3. Validate Input

All input is validated on both frontend and backend:
- Maximum length: 1000 characters
- No empty messages
- XSS prevention

---

## Performance Tips

### 1. Optimize Polling

Adjust polling based on user activity:

```tsx
const pollingInterval = isActive ? 3000 : 10000;

const { messages } = useMatchChat({
  matchId,
  pollingInterval,
});
```

### 2. Lazy Load Messages

For long conversations, implement pagination:

```tsx
const { messages } = useMatchChat({
  matchId,
  limit: 50, // Load 50 messages at a time
});
```

### 3. Memoize Components

Use React.memo for expensive components:

```tsx
export const MessageList = React.memo(({ messages, currentUserId }) => {
  // Component logic
});
```

---

## Troubleshooting

### Messages Not Updating

1. Check polling interval
2. Verify match ID is correct
3. Check network connectivity
4. Verify backend API is running

### Send Button Disabled

1. Check if message is empty
2. Verify chat is not disabled
3. Check if sending is in progress
4. Verify user permissions

### External Contact Warning Not Showing

1. Check backend detection service
2. Verify message content
3. Check warning state management

---

## Examples

### Complete Integration

```tsx
import { MatchChat } from '@/components/p2p-exchange';
import { useMatch } from '@/hooks/useMatch';
import { useAuth } from '@/hooks/useAuth';

export function MatchChatPage() {
  const { matchId } = useParams();
  const { match, isLoading: matchLoading } = useMatch(matchId);
  const { user } = useAuth();

  if (matchLoading) {
    return <LoadingSpinner />;
  }

  if (!match) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Match details */}
        <div className="lg:col-span-1">
          <MatchDetails match={match} />
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 h-[600px]">
          <MatchChat 
            match={match}
            currentUserId={user.id}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
```

### Standalone Message Input

```tsx
import { MessageInput } from '@/components/p2p-exchange';
import { useState } from 'react';

export function StandaloneInput() {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (content: string) => {
    setIsSending(true);
    try {
      await api.sendMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MessageInput 
      onSend={handleSend}
      isSending={isSending}
      placeholder="اكتب رسالتك..."
    />
  );
}
```

---

## API Reference

### Communication API

```typescript
class CommunicationAPI {
  // Get all messages for a match
  async getMessages(matchId: string): Promise<Message[]>

  // Send a message
  async sendMessage(
    matchId: string, 
    request: SendMessageRequest
  ): Promise<Message>

  // Flag a message (admin only)
  async flagMessage(messageId: string, reason: string): Promise<void>

  // Get flagged messages (admin only)
  async getFlaggedMessages(): Promise<Message[]>
}
```

---

## Support

For issues or questions:
- Check the troubleshooting section
- Review the examples
- Contact the development team

---

**Last Updated**: January 27, 2026  
**Version**: 1.0.0  
**Component**: Communication UI
