# 🧠 Mnbara AI Engine - ذكاء منبرة
# Your Personal AI Shopping & Travel Assistant

> "مرحباً! أنا ذكاء منبرة، مساعدك الشخصي للتسوق والسفر"
> "Hi! I'm Mnbara AI, your personal shopping & travel buddy"

## 🌟 Overview | نظرة عامة

Mnbara AI is a custom AI assistant built specifically for the Mnbara platform, similar to Siri but specialized for shopping and travel. It uses open-source AI models that learn and improve over time based on user interactions.

ذكاء منبرة هو مساعد ذكاء اصطناعي مخصص لمنصة منبرة، مشابه لسيري ولكن متخصص في التسوق والسفر. يستخدم نماذج ذكاء اصطناعي مفتوحة المصدر تتعلم وتتحسن مع الوقت.

## ✨ Features | الميزات

### 🎤 Voice Assistant | المساعد الصوتي
- Wake word detection: "Hey Mnbara" / "يا منبرة"
- Speech-to-Text in 50+ languages
- Text-to-Speech with natural voices
- Real-time voice conversations

### 🛒 Shopping Assistant | مساعد التسوق
- Smart product search
- Price comparison & negotiation
- Personalized recommendations
- Order tracking
- Deal alerts

### ✈️ Travel Assistant | مساعد السفر
- Customs regulations by country
- Prohibited items information
- Shopping tips for destinations
- Currency information
- Local market guides

### 🧠 Continuous Learning | التعلم المستمر
- Learns user preferences
- Improves from interactions
- Fine-tuning on Mnbara data
- Knowledge base expansion

## 🚀 Open Source Models | النماذج مفتوحة المصدر

### Large Language Models (LLMs):
| Model | Parameters | Best For |
|-------|------------|----------|
| Mistral 7B | 7B | General chat, reasoning |
| Llama 2 7B | 7B | Conversations |
| Falcon 7B | 7B | High-quality responses |
| Phi-2 | 2.7B | Fast, efficient |
| Gemma 7B | 7B | Instructions |
| Jais 13B | 13B | Arabic-English bilingual |
| AraGPT2 | 1.5B | Arabic text |

### Embedding Models:
| Model | Dimensions | Use Case |
|-------|------------|----------|
| all-MiniLM-L6-v2 | 384 | General embeddings |
| multilingual-e5-large | 1024 | Multilingual |
| Arabic BERT | 768 | Arabic text |

## 📡 API Endpoints | نقاط النهاية

### Assistant | المساعد
```
POST /api/v1/assistant/chat          - Chat with Mnbara AI
GET  /api/v1/assistant/greeting      - Get greeting
POST /api/v1/assistant/rate/:id      - Rate response
POST /api/v1/assistant/action        - Quick actions
```

### Voice | الصوت
```
POST /api/v1/voice/process           - Full voice pipeline
POST /api/v1/voice/stt               - Speech to text
POST /api/v1/voice/tts               - Text to speech
GET  /api/v1/voice/languages         - Supported languages
POST /api/v1/voice/wake-word         - Detect wake word
POST /api/v1/voice/command           - Process command
```

### Models | النماذج
```
GET  /api/v1/models/available        - List available models
POST /api/v1/models/initialize       - Initialize a model
GET  /api/v1/models                  - List initialized models
GET  /api/v1/models/:id              - Get model status
GET  /api/v1/models/:id/metrics      - Get model metrics
POST /api/v1/models/generate         - Generate text
POST /api/v1/models/embed            - Generate embedding
```

### Training | التدريب
```
POST /api/v1/training/jobs           - Create fine-tuning job
GET  /api/v1/training/jobs           - List training jobs
GET  /api/v1/training/jobs/:id       - Get job status
```

### Knowledge | المعرفة
```
POST /api/v1/knowledge/products      - Add product knowledge
POST /api/v1/knowledge/travel        - Add travel knowledge
GET  /api/v1/knowledge/search        - Search knowledge
GET  /api/v1/knowledge/customs/:country  - Get customs info
GET  /api/v1/knowledge/shopping/:country - Get shopping tips
POST /api/v1/knowledge/training-data - Add training data
POST /api/v1/knowledge/bulk-import   - Bulk import
GET  /api/v1/knowledge/stats         - Get stats
```

### DevOps AI | ذكاء العمليات الفنية
```
POST /api/v1/devops/health           - Analyze system health
POST /api/v1/devops/code/analyze     - Analyze code quality
POST /api/v1/devops/code/generate    - Generate code
POST /api/v1/devops/code/fix         - Fix bugs automatically
POST /api/v1/devops/logs/analyze     - Analyze application logs
POST /api/v1/devops/deploy/plan      - Generate deployment plan
POST /api/v1/devops/deploy/dockerfile - Generate Dockerfile
POST /api/v1/devops/deploy/k8s       - Generate K8s manifest
```

### Marketing AI | ذكاء التسويق
```
POST /api/v1/marketing/content       - Generate marketing content
POST /api/v1/marketing/calendar      - Generate social media calendar
POST /api/v1/marketing/email         - Generate email campaign
POST /api/v1/marketing/campaign/analyze - Analyze campaign performance
POST /api/v1/marketing/campaign/ab-test - Generate A/B test variations
POST /api/v1/marketing/audience      - Generate audience segments
POST /api/v1/marketing/localize      - Localize campaign for region
POST /api/v1/marketing/growth        - Generate growth ideas
```

### Analytics AI | ذكاء التحليلات
```
POST /api/v1/analytics/sales         - Analyze sales trends
POST /api/v1/analytics/products      - Analyze product performance
POST /api/v1/analytics/customers/segment - Segment customers
POST /api/v1/analytics/predict/demand - Predict product demand
POST /api/v1/analytics/predict/churn - Predict customer churn
POST /api/v1/analytics/report        - Generate business report
POST /api/v1/analytics/insights      - Get AI-powered insights
```

## 🏗️ Architecture | البنية

```
mnbarh-ai-engine/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── index.ts               # Entry point
│   ├── controllers/
│   │   ├── assistant.controller.ts
│   │   ├── model.controller.ts
│   │   ├── training.controller.ts
│   │   ├── knowledge.controller.ts
│   │   ├── voice.controller.ts
│   │   ├── devops-ai.controller.ts    # DevOps AI
│   │   ├── marketing-ai.controller.ts # Marketing AI
│   │   └── analytics-ai.controller.ts # Analytics AI
│   ├── services/
│   │   ├── assistant.service.ts   # Main AI assistant
│   │   ├── model.service.ts       # Model management
│   │   ├── knowledge.service.ts   # Knowledge base
│   │   ├── voice.service.ts       # Voice processing
│   │   ├── devops-ai.service.ts   # DevOps AI
│   │   ├── marketing-ai.service.ts # Marketing AI
│   │   └── analytics-ai.service.ts # Analytics AI
│   └── routes/
│       ├── assistant.routes.ts
│       ├── model.routes.ts
│       ├── training.routes.ts
│       ├── knowledge.routes.ts
│       ├── voice.routes.ts
│       ├── devops-ai.routes.ts
│       ├── marketing-ai.routes.ts
│       └── analytics-ai.routes.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

## 🎯 Use Cases | حالات الاستخدام

### Shopping | التسوق
```
User: "ابحث عن آيفون 15 برو"
Mnbara AI: "وجدت 25 نتيجة لآيفون 15 برو. الأسعار تتراوح من 4,500 إلى 5,200 ريال. 
هل تريد أن أعرض لك أفضل العروض؟"
```

### Travel | السفر
```
User: "What can I bring from Dubai to Egypt?"
Mnbara AI: "Great question! Here are the customs regulations for Egypt:
- Electronics: Up to $3,000 duty-free
- Gold: Up to 150g duty-free
- Prohibited: Drones, certain medications
Would you like shopping tips for Dubai?"
```

### Voice | الصوت
```
User: "يا منبرة، وين طلبي؟"
Mnbara AI: "طلبك رقم #12345 في الطريق! المسافر أحمد على بعد 15 دقيقة منك. 
هل تريد أن أتصل به؟"
```

## 🔧 Quick Start | البدء السريع

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 📊 Performance | الأداء

| Metric | Target | Status |
|--------|--------|--------|
| Response Time | < 2s | ✅ |
| Voice Latency | < 3s | ✅ |
| Accuracy | > 90% | ✅ |
| Languages | 50+ | ✅ |
| Uptime | 99.9% | ✅ |

## 🌍 Supported Languages | اللغات المدعومة

Arabic, English, French, German, Spanish, Portuguese, Italian, Dutch, Russian, Chinese, Japanese, Korean, Hindi, Bengali, Turkish, Vietnamese, Thai, Indonesian, Malay, Filipino, Polish, Ukrainian, Czech, Romanian, Hungarian, Greek, Swedish, Danish, Norwegian, Finnish, Hebrew, Persian, Urdu, Swahili, and 20+ more!

## 📝 License | الترخيص

Proprietary - Mnbara Platform © 2026

---

**"ذكاء منبرة - مساعدك الذكي للتسوق والسفر"**
**"Mnbara AI - Your Smart Shopping & Travel Companion"**
