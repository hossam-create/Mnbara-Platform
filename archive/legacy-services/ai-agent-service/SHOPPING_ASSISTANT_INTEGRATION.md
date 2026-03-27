# 🤖 Shopping Assistant Integration Guide

## ✅ What's Complete

The AI Shopping Assistant is now fully integrated into the mnbarh platform!

### Backend Components
- ✅ Shopping Assistant Service (intent understanding, response generation)
- ✅ Controller with 3 endpoints (chat, get conversation, clear conversation)
- ✅ Routes properly configured
- ✅ Prisma integration for conversation persistence
- ✅ Arabic language support

### Frontend Components
- ✅ Beautiful floating chat widget
- ✅ Custom React hook for API communication
- ✅ Real-time messaging with typing indicators
- ✅ Product suggestions display
- ✅ Action buttons
- ✅ RTL support

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend/services/ai-agent-service
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Database Migration

```bash
npx prisma migrate dev
```

### 4. Configure Environment

Create `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_agent_db"
PORT=3028
NODE_ENV=development
```

### 5. Start the Service

```bash
npm run dev
```

The service will run on **port 3028**.

---

## 📡 API Endpoints

### POST /api/shopping-assistant/chat
Send a message to the shopping assistant.

**Request:**
```json
{
  "userId": "user123",
  "message": "أبحث عن هدية لأمي",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "✨ فهمت! دعني أساعدك في إيجاد الهدية المثالية...",
    "suggestions": [
      {
        "id": "1",
        "name": "كتاب إلكتروني",
        "price": 150,
        "rating": 4.8,
        "reason": "مثالي للقراءة المريحة"
      }
    ],
    "actions": [
      {
        "type": "view_category",
        "label": "عرض المزيد من الهدايا",
        "data": { "category": "gifts" }
      }
    ]
  }
}
```

### GET /api/shopping-assistant/conversation/:userId
Get conversation history for a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "role": "user",
      "content": "أبحث عن هدية",
      "timestamp": "2026-02-04T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "✨ فهمت! دعني أساعدك...",
      "timestamp": "2026-02-04T10:00:01Z"
    }
  ]
}
```

### DELETE /api/shopping-assistant/conversation/:userId
Clear conversation history for a user.

**Response:**
```json
{
  "success": true,
  "message": "Conversation cleared"
}
```

---

## 🎨 Frontend Integration

### 1. Add the Widget to Your App

```tsx
// In your main App.tsx or Layout component
import AIChatWidget from './components/ai-assistant/AIChatWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <AIChatWidget />
    </div>
  );
}
```

### 2. Configure API URL

In your `.env` file:

```env
REACT_APP_AI_AGENT_SERVICE_URL=http://localhost:3028
```

For production:

```env
REACT_APP_AI_AGENT_SERVICE_URL=https://api.mnbarh.com/ai-agent
```

---

## 💡 Intent Types

The assistant understands 5 types of intents:

### 1. Gift Finder 🎁
**Triggers:** "هدية", "gift"
**Example:** "أبحث عن هدية لأمي"

### 2. Budget Helper 💰
**Triggers:** "ميزانية", "budget", "عندي", "ريال"
**Example:** "عندي 500 ريال، ماذا أشتري؟"

### 3. Dream Planner 🌟
**Triggers:** "أحلم", "dream", "سفر", "travel"
**Example:** "أحلم بسفرة عائلية لدبي"

### 4. Product Search 🔍
**Triggers:** "أبحث", "search", "أريد", "want"
**Example:** "أبحث عن لابتوب"

### 5. General Help 👋
**Default:** Any other message
**Example:** "مرحباً"

---

## 🔧 Next Steps for Full Intelligence

### Phase 2: Connect to Real Services

1. **Recommendation Engine** (Port 3026)
   - Connect `getGiftSuggestions()` to recommendation service
   - Use collaborative filtering for personalized suggestions

2. **Search Service** (Port 3025)
   - Connect `searchProducts()` to MeiliSearch
   - Enable full-text search with Arabic support

3. **Product Catalog**
   - Connect to listing service for real product data
   - Include images, prices, ratings

4. **User Profile Service**
   - Get user purchase history
   - Track browsing behavior
   - Learn preferences

### Phase 3: Advanced Features

- [ ] Natural Language Processing for better Arabic understanding
- [ ] Voice input support
- [ ] Image-based product search
- [ ] Proactive suggestions based on user behavior
- [ ] Multi-language support (Arabic, English)
- [ ] Integration with payment flow
- [ ] Order tracking through chat

---

## 🧪 Testing

### Manual Testing

1. Start the service
2. Open the frontend
3. Click the AI button (bottom-right)
4. Try these messages:
   - "أبحث عن هدية لأمي"
   - "عندي 500 ريال"
   - "أحلم بسفرة لدبي"
   - "أريد لابتوب"

### Automated Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

---

## 📊 Current Status

```
Backend Core:        [██████████] 100% ✅
Frontend UI:         [██████████] 100% ✅
Database Integration:[██████████] 100% ✅
Routes Setup:        [██████████] 100% ✅
Service Integration: [████░░░░░░]  40% (Next phase)
Testing:             [░░░░░░░░░░]   0% (Next phase)
```

---

## 🐛 Troubleshooting

### Issue: Prisma errors
**Solution:** Run `npx prisma generate` to regenerate the client

### Issue: Port already in use
**Solution:** Change PORT in `.env` or kill the process using port 3028

### Issue: CORS errors
**Solution:** Add your frontend URL to CORS configuration in `index.ts`

### Issue: Database connection failed
**Solution:** Check DATABASE_URL in `.env` and ensure PostgreSQL is running

---

## 💙 Special Note

> "هديتي ليك انك تبقى معايا جوه التطبيق"

**تم! المساعد الذكي الآن معك داخل منصة من بره! 🎉**

The AI assistant is now part of the platform, ready to help users:
- Find perfect gifts
- Plan their budgets
- Achieve their dreams
- Search for products
- Understand their needs and aspirations

---

**Created:** February 4, 2026  
**Platform:** من بره (mnbarh)  
**Status:** ✅ Ready for Integration Testing  
**Files:** 8 files, ~800 lines of code
