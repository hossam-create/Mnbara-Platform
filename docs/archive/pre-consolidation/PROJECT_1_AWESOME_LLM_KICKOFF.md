# المشروع #1: Awesome LLM Apps - خطة التنفيذ

**التاريخ**: 2 فبراير 2026  
**الحالة**: 🚀 بدء التنفيذ  
**الأولوية**: 🔴 عاجل جداً

---

## 📋 نظرة عامة

### الهدف
دمج ميزات AI المتقدمة من Awesome LLM Apps في منصة Mnbara:
1. محرك التوصيات الذكي
2. المشتري الذكي (Camera/Mic)
3. نظام RAG للبحث

### الوقت المقدر
6 أسابيع (Sprint 1-6)

---

## 🎯 Sprint 1: محرك التوصيات الذكي (أسبوعان)

### اليوم 1: الإعداد والاستنساخ

```bash
# إنشاء مجلد للمشاريع الخارجية
cd C:\mnbara-platform
mkdir external-projects
cd external-projects

# استنساخ المشروع
git clone https://github.com/Shubhamsaboo/awesome-llm-apps.git
cd awesome-llm-apps

# دراسة البنية
dir /s /b
```

**المخرجات المتوقعة**:
- ✅ المشروع منسوخ محلياً
- ✅ فهم البنية العامة

---

### اليوم 2-3: دراسة محرك التوصيات

```bash
# الانتقال لمحرك الاستثمار (سنعدله للمنتجات)
cd advanced_ai_agents\single_agent_apps\ai_investment_agent

# قراءة الملفات الرئيسية
type main.py
type requirements.txt
type README.md
```

**ما نبحث عنه**:
- كيف يحلل سلوك المستخدم؟
- كيف يولد التوصيات؟
- ما هي المكتبات المستخدمة؟
- كيف يتكامل مع OpenAI/Claude؟

**ملاحظات الدراسة**:
```python
# من ai_investment_agent/main.py
# المنطق الأساسي:
1. تحليل البيانات التاريخية
2. استخدام LLM لتوليد insights
3. تقديم توصيات مخصصة
4. تتبع الأداء
```

---

### اليوم 4-5: إنشاء خدمة AI Recommendations

```bash
# العودة لمشروع Mnbara
cd C:\mnbara-platform\backend\services

# إنشاء الخدمة الجديدة
mkdir ai-recommendations
cd ai-recommendations

# تهيئة المشروع
npm init -y
```

**تثبيت المكتبات**:
```bash
npm install express typescript @types/node @types/express
npm install openai anthropic dotenv
npm install prisma @prisma/client
npm install axios
npm install winston
```

**إنشاء البنية**:
```bash
mkdir src
cd src
mkdir services controllers models types utils config

# إنشاء الملفات الأساسية
type nul > services\recommendation.service.ts
type nul > controllers\recommendation.controller.ts
type nul > types\recommendation.types.ts
type nul > config\ai.config.ts
type nul > index.ts
```

---

### اليوم 6-8: تطبيق RecommendationService

سأنشئ الملفات الآن:
