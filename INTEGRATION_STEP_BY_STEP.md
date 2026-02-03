# دليل التنفيذ خطوة بخطوة - دمج المشاريع المفتوحة المصدر

**التاريخ**: 2 فبراير 2026  
**الهدف**: دليل عملي للتنفيذ الفوري

---

## 🚀 البدء الفوري - اليوم!

### الخطوة 1: استنساخ المشاريع (10 دقائق)

```bash
# إنشاء مجلد للمشاريع المفتوحة المصدر
cd C:\mnbara-platform
mkdir external-projects
cd external-projects

# استنساخ المشاريع
git clone https://github.com/Shubhamsaboo/awesome-llm-apps
git clone https://github.com/Aryamanraj/SmartContractEscrowSystem
git clone https://github.com/numman-ali/openskills
git clone https://github.com/pixlcore/xyops
git clone https://github.com/SiriusScan/Sirius

echo "✅ تم استنساخ جميع المشاريع"
```

---

## 📚 المرحلة 1: دراسة الكود (يوم واحد)

### A. دراسة Awesome LLM Apps

```bash
cd awesome-llm-apps

# 1. دراسة محرك التوصيات
cd advanced_ai_agents/single_agent_apps/ai_investment_agent
cat main.py
cat requirements.txt

# 2. دراسة Smart Buyer
cd ../../starter_ai_agents/ai_meme_generator_agent_browseruse
cat main.py

# 3. دراسة RAG
cd ../../rag_tutorials/hybrid_search_rag
cat main.py

# اكتب ملاحظاتك
echo "ملاحظات الدراسة:" > study-notes.txt
```

### B. دراسة Escrow System

```bash
cd SmartContractEscrowSystem

# دراسة Smart Contract
cd src/contracts
cat EscrowContract.sol

# دراسة الواجهات
cd ..
cat BuyerLogin.js
cat SellerLogin.js
cat ArbitratorLogin.js

# اكتب ملاحظاتك
echo "ملاحظات Escrow:" > escrow-notes.txt
```

---

## 🔨 المرحلة 2: Sprint 1 - Product Recommendations (أسبوعان)

### اليوم 1-2: إعداد البيئة

```bash
# العودة لمشروع Mnbara
cd C:\mnbara-platform

# إنشاء خدمة AI Recommendations
mkdir -p backend\services\ai-recommendations
cd backend\services\ai-recommendations

# تهيئة المشروع
npm init -y
npm install express typescript @types/node @types/express
npm install openai anthropic dotenv
npm install prisma @prisma/client

# إنشاء البنية
mkdir -p src\services
mkdir -p src\controllers
mkdir -p src\models
mkdir -p src\types
mkdir -p src\utils

# إنشاء tsconfig.json
echo {
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
} > tsconfig.json
```

### اليوم 3-5: تطبيق محرك التوصيات

```typescript
// src/services/recommendation.service.ts
import { OpenAI } from 'openai';

export class RecommendationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async getProductRecommendations(userId: string, context: any) {
    // منطق من ai_investment_agent
    const userBehavior = await this.analyzeUserBehavior(userId);
    const recommendations = await this.generateRecommendations(userBehavior, context);
    return recommendations;
  }

  private async analyzeUserBehavior(userId: string) {
    // تحليل سلوك المستخدم
    // من ai_investment_agent/analysis_logic.py
  }

  private async generateRecommendations(behavior: any, context: any) {
    const prompt = `
      Based on user behavior: ${JSON.stringify(behavior)}
      And context: ${JSON.stringify(context)}
      Recommend 5 products that match their interests.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });

    return response.choices[0].message.content;
  }
}
```

### اليوم 6-8: إنشاء API

```typescript
// src/controllers/recommendation.controller.ts
import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';

export class RecommendationController {
  private service: RecommendationService;

  constructor() {
    this.service = new RecommendationService();
  }

  async getRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const context = req.body;

      const recommendations = await this.service.getProductRecommendations(
        userId,
        context
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

// src/index.ts
import express from 'express';
import { RecommendationController } from './controllers/recommendation.controller';

const app = express();
app.use(express.json());

const controller = new RecommendationController();

app.post('/api/v1/recommendations/:userId', 
  controller.getRecommendations.bind(controller)
);

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`AI Recommendations Service running on port ${PORT}`);
});
```

### اليوم 9-10: اختبار

```bash
# تشغيل الخدمة
npm run dev

# اختبار API
curl -X POST http://localhost:3010/api/v1/recommendations/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "category": "electronics",
    "priceRange": { "min": 100, "max": 500 }
  }'
```

---

## 🔨 المرحلة 3: Sprint 2 - Smart Buyer (أسبوعان)

### اليوم 1-3: Camera Component

```bash
# Frontend
cd C:\mnbara-platform\frontend\web-app

# تثبيت المكتبات
npm install react-webcam
npm install @tensorflow/tfjs
npm install @tensorflow-models/coco-ssd
```

```typescript
// src/components/smart-buyer/CameraCapture.tsx
import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export const CameraCapture: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [detections, setDetections] = useState<any[]>([]);

  const captureAndAnalyze = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      // تحميل النموذج
      const model = await cocoSsd.load();
      
      // التعرف على الأشياء
      const img = new Image();
      img.src = imageSrc!;
      img.onload = async () => {
        const predictions = await model.detect(img);
        setDetections(predictions);
        
        // إرسال للـ Backend للمطابقة
        await matchProducts(predictions);
      };
    }
  };

  const matchProducts = async (predictions: any[]) => {
    const response = await fetch('/api/v1/smart-buyer/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detections: predictions })
    });
    
    const products = await response.json();
    console.log('Matched products:', products);
  };

  return (
    <div className="camera-capture">
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
      />
      <button onClick={captureAndAnalyze}>
        التقط وابحث
      </button>
      
      {detections.length > 0 && (
        <div className="detections">
          <h3>تم اكتشاف:</h3>
          {detections.map((det, i) => (
            <div key={i}>
              {det.class} - {(det.score * 100).toFixed(2)}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### اليوم 4-7: Audio Recorder

```bash
npm install react-audio-recorder
npm install @google-cloud/speech
```

```typescript
// src/components/smart-buyer/AudioRecorder.tsx
import React, { useState } from 'react';
import { AudioRecorder as Recorder } from 'react-audio-recorder';

export const AudioRecorder: React.FC = () => {
  const [transcript, setTranscript] = useState('');

  const handleAudioStop = async (audioBlob: Blob) => {
    // إرسال للـ Backend
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/v1/smart-buyer/transcribe', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    setTranscript(data.transcript);
    
    // البحث بناءً على النص
    await searchByVoice(data.transcript);
  };

  const searchByVoice = async (text: string) => {
    const response = await fetch('/api/v1/smart-buyer/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text })
    });

    const products = await response.json();
    console.log('Found products:', products);
  };

  return (
    <div className="audio-recorder">
      <Recorder
        onStop={handleAudioStop}
        backgroundColor="#fff"
        foregroundColor="#000"
      />
      
      {transcript && (
        <div className="transcript">
          <h3>ما قلته:</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};
```

### اليوم 8-10: Backend Integration

```typescript
// backend/services/ai-vision/src/services/vision.service.ts
import { OpenAI } from 'openai';

export class VisionService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeImage(imageBase64: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What products do you see in this image? List them.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ]
    });

    return response.choices[0].message.content;
  }

  async matchProducts(detections: any[]) {
    // مطابقة مع قاعدة البيانات
    const productNames = detections.map(d => d.class);
    
    // البحث في قاعدة البيانات
    const products = await this.searchProducts(productNames);
    
    return products;
  }

  private async searchProducts(names: string[]) {
    // منطق البحث
  }
}
```

---

## 🔨 المرحلة 4: Sprint 3 - Escrow System (أسبوعان)

### اليوم 1-3: دراسة Smart Contract

```bash
cd C:\mnbara-platform\external-projects\SmartContractEscrowSystem
cd src\contracts

# قراءة Smart Contract
cat EscrowContract.sol

# فهم الوظائف الأساسية:
# - createTransaction()
# - addSign()
# - lockTnx()
# - releaseTnx()
# - initiateDispute()
# - resolveDispute()
```

### اليوم 4-7: تطبيق Traditional Escrow

```typescript
// backend/services/escrow-service/src/services/escrow.service.ts
import { PrismaClient } from '@prisma/client';

export class EscrowService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createEscrow(data: CreateEscrowDto) {
    // منطق من Smart Contract
    const escrow = await this.prisma.escrow.create({
      data: {
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        amount: data.amount,
        status: 'PENDING',
        signatures: []
      }
    });

    return escrow;
  }

  async addSignature(escrowId: string, userId: string, signature: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) throw new Error('Escrow not found');

    // إضافة التوقيع
    const signatures = [...escrow.signatures, { userId, signature }];

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: { signatures }
    });

    // إذا اكتملت التوقيعات، قفل المعاملة
    if (signatures.length >= 2) {
      await this.lockTransaction(escrowId);
    }
  }

  async lockTransaction(escrowId: string) {
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: { status: 'LOCKED' }
    });

    // حجز الأموال من المشتري
    await this.holdFunds(escrowId);
  }

  async releaseFunds(escrowId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (escrow?.status !== 'LOCKED') {
      throw new Error('Cannot release funds');
    }

    // تحويل الأموال للبائع
    await this.transferFunds(escrow.buyerId, escrow.sellerId, escrow.amount);

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: { status: 'COMPLETED' }
    });
  }

  async initiateDispute(escrowId: string, reason: string) {
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: 'DISPUTED',
        disputeReason: reason
      }
    });
  }

  async resolveDispute(escrowId: string, resolution: 'BUYER' | 'SELLER') {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (resolution === 'BUYER') {
      // رد الأموال للمشتري
      await this.refundFunds(escrow!.buyerId, escrow!.amount);
    } else {
      // تحويل للبائع
      await this.transferFunds(escrow!.buyerId, escrow!.sellerId, escrow!.amount);
    }

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: { status: 'RESOLVED' }
    });
  }

  private async holdFunds(escrowId: string) {
    // منطق حجز الأموال
  }

  private async transferFunds(from: string, to: string, amount: number) {
    // منطق التحويل
  }

  private async refundFunds(userId: string, amount: number) {
    // منطق الاسترداد
  }
}
```

### اليوم 8-10: اختبار

```bash
# اختبار Escrow
npm test

# اختبار يدوي
curl -X POST http://localhost:3011/api/v1/escrow \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer123",
    "sellerId": "seller456",
    "amount": 1000
  }'
```

---

## ✅ Checklist التنفيذ

### الأسبوع 1-2: Product Recommendations
- [ ] استنساخ awesome-llm-apps
- [ ] دراسة ai_investment_agent
- [ ] إنشاء ai-recommendations service
- [ ] تطبيق RecommendationService
- [ ] إنشاء API endpoints
- [ ] اختبار التوصيات
- [ ] دمج مع Frontend

### الأسبوع 3-4: Smart Buyer
- [ ] تثبيت react-webcam
- [ ] إنشاء CameraCapture component
- [ ] تثبيت react-audio-recorder
- [ ] إنشاء AudioRecorder component
- [ ] إنشاء ai-vision service
- [ ] تطبيق VisionService
- [ ] اختبار Camera + Audio

### الأسبوع 5-6: RAG Search
- [ ] دراسة hybrid_search_rag
- [ ] إعداد Vector Database
- [ ] إنشاء search-service
- [ ] تطبيق Hybrid Search
- [ ] تطبيق Vision RAG
- [ ] اختبار البحث

### الأسبوع 7-8: Escrow System
- [ ] دراسة EscrowContract.sol
- [ ] تطبيق EscrowService
- [ ] إنشاء API endpoints
- [ ] اختبار Escrow flow
- [ ] دمج مع Frontend

---

## 🎯 النتيجة المتوقعة

بعد 8 أسابيع، ستحصل على:

✅ محرك توصيات ذكي يعمل  
✅ Smart Buyer (Camera + Mic) يعمل  
✅ RAG Search متقدم  
✅ نظام Escrow آمن  

**منصة Mnbara ستكون أكثر ذكاءً وتقدماً!**

---

**التاريخ**: 2 فبراير 2026  
**الحالة**: ✅ جاهز للتنفيذ الفوري
