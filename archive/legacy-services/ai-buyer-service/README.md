# Smart Buyer AI Service

Camera/Mic powered product search and matching for Mnbara E-commerce Platform.

## Capabilities

- **Visual Product Search** - Capture or upload product photos for AI-powered product recognition
- **Voice Search** - Speech-to-text for hands-free product discovery
- **AI Image Recognition** - TensorFlow.js powered object and label detection
- **Product Matching** - Intelligent matching from images, voice, or text queries
- **Smart Recommendations** - Context-aware product suggestions
- **Natural Language Understanding** - Intent detection and entity extraction

## Quick Start

```bash
# Install dependencies
cd backend/services/ai-buyer-service
npm install

# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Camera Integration
- `POST /api/ai-buyer/camera/upload` - Upload camera-captured image
- `POST /api/ai-buyer/gallery/upload` - Upload image from gallery

### Voice Processing
- `POST /api/ai-buyer/voice/process` - Process voice/audio input

### Smart Search
- `POST /api/ai-buyer/search` - Natural language product search
- `GET /api/ai-buyer/suggestions/:query` - Get search suggestions

### Product Matching
- `POST /api/ai-buyer/match` - Match products from query

### Health
- `GET /api/ai-buyer/health` - Service health check

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 3025 |
| NODE_ENV | Environment | development |
| LOG_LEVEL | Logging level | info |
| GOOGLE_CLOUD_PROJECT | GCP project ID | - |
| TENSORFLOW_MODEL_PATH | Custom TF model path | - |

## Architecture

```
ai-buyer-service/
├── src/
│   ├── index.ts              # Entry point
│   ├── controllers/         # HTTP handlers
│   │   └── ai-buyer.controller.ts
│   ├── routes/              # API routes
│   │   └── ai-buyer.routes.ts
│   ├── services/            # Business logic
│   │   ├── image-recognition.service.ts
│   │   ├── voice-processing.service.ts
│   │   ├── product-matching.service.ts
│   │   └── smart-search.service.ts
│   ├── types/               # TypeScript types
│   │   └── ai-buyer.types.ts
│   └── utils/               # Utilities
│       └── logger.ts
├── package.json
└── tsconfig.json
```

## Integration with Frontend

### Camera Capture
```javascript
const captureImage = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'environment' } 
  });
  // ... capture frame and upload
};
```

### Voice Search
```javascript
const recordVoice = async () => {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    // Process with API
  };
};
```

## License

Mnbara Platform - All Rights Reserved
