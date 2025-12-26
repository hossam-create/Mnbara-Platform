# 🎤 Voice Commerce Service - خدمة التجارة الصوتية

Voice-enabled shopping experience for Mnbara platform.

تجربة تسوق صوتية لمنصة منبرة.

## Features | الميزات

### Speech Recognition | التعرف على الكلام
- Arabic (ar-SA) and English (en-US) support
- Real-time transcription
- High accuracy (95%+)

### Intent Recognition | التعرف على النوايا
- 12+ supported intents
- Pattern-based matching
- Keyword fallback
- Entity extraction

### Supported Commands | الأوامر المدعومة
| Intent | English | Arabic |
|--------|---------|--------|
| Search | "search for iPhone" | "ابحث عن ايفون" |
| Add to Cart | "add to cart" | "اضف للسلة" |
| View Cart | "show my cart" | "عرض السلة" |
| Checkout | "checkout" | "اتمام الشراء" |
| Track Order | "track my order" | "تتبع طلبي" |
| Get Help | "help" | "مساعدة" |

### Text-to-Speech | تحويل النص لصوت
- Natural voice synthesis
- Multiple voice options
- Speed and pitch control

## API Endpoints | نقاط النهاية

### Voice Commands
```
POST /api/voice/command        - Process voice command (audio)
POST /api/voice/text-command   - Process text command (testing)
POST /api/voice/synthesize     - Text to speech
```

### Sessions
```
GET  /api/voice/sessions/:userId  - Get user sessions
GET  /api/voice/session/:id       - Get session details
POST /api/voice/session/:id/end   - End session
```

### Preferences
```
GET /api/voice/preferences/:userId  - Get preferences
PUT /api/voice/preferences/:userId  - Update preferences
```

### Intents
```
GET    /api/intents/patterns     - List patterns
POST   /api/intents/patterns     - Create pattern
PUT    /api/intents/patterns/:id - Update pattern
DELETE /api/intents/patterns/:id - Delete pattern
POST   /api/intents/recognize    - Test recognition
```

### Analytics
```
GET /api/analytics/dashboard       - Dashboard stats
GET /api/analytics/metrics         - Metrics over time
GET /api/analytics/report/intents  - Intent breakdown
GET /api/analytics/report/languages - Language breakdown
```

## Setup | الإعداد

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Environment Variables | متغيرات البيئة

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/voice_db
REDIS_URL=redis://localhost:6379
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
PORT=3021
```

## Tech Stack | التقنيات

- Node.js + Express + TypeScript
- Google Cloud Speech-to-Text
- Google Cloud Text-to-Speech
- Google Cloud Natural Language
- Prisma ORM + PostgreSQL
- Redis

## Port: 3021
