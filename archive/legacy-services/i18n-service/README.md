# i18n Service (Internationalization)

Comprehensive multi-language translation management service for the Mnbara platform using i18next.

## Features

### Language Management
- 🌍 Multiple language support
- 🔄 RTL/LTR direction support
- ✅ Enable/disable languages
- 🎯 Default language configuration
- 📊 Language statistics

### Translation Management
- 📝 Key-based translations
- 🗂️ Namespace organization
- 🔍 Search translations
- 📊 Missing translation detection
- ✏️ Batch translation updates
- 🔄 Translation verification

### Advanced Features
- i18next integration
- Database-backed translations
- Translation statistics
- Missing translation reports
- Namespace-based organization
- Search functionality
- Batch operations

## API Endpoints

### Languages

#### Create Language
```http
POST /api/languages
Body: {
  "code": "ar",
  "name": "Arabic",
  "nativeName": "العربية",
  "direction": "rtl",
  "enabled": true,
  "isDefault": false
}
```

#### Get All Languages
```http
GET /api/languages?enabled=true
```

#### Get Default Language
```http
GET /api/languages/default
```

#### Toggle Language
```http
POST /api/languages/:code/toggle
```

### Translations

#### Upsert Translation
```http
POST /api/translations
Body: {
  "key": "common.welcome",
  "namespace": "common",
  "translations": {
    "en": "Welcome",
    "ar": "مرحبا",
    "fr": "Bienvenue"
  },
  "description": "Welcome message"
}
```

#### Get Translation
```http
GET /api/translations/:key?lang=ar
```

#### Get Namespace Translations
```http
GET /api/translations/namespace/:namespace?lang=en
```

#### Get All Translations
```http
GET /api/translations?lang=en
Response: {
  "common": {
    "welcome": "Welcome",
    "goodbye": "Goodbye"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout"
  }
}
```

#### Translate
```http
POST /api/translations/translate
Body: {
  "key": "common.welcome",
  "lang": "ar"
}
```

#### Batch Translate
```http
POST /api/translations/translate/batch
Body: {
  "keys": ["common.welcome", "common.goodbye"],
  "lang": "ar"
}
```

#### Search Translations
```http
GET /api/translations/search?q=welcome&lang=en
```

#### Get Missing Translations
```http
GET /api/translations/missing?lang=ar
```

#### Get Statistics
```http
GET /api/translations/stats
Response: [
  {
    "language": "en",
    "name": "English",
    "total": 100,
    "translated": 100,
    "missing": 0,
    "percentage": 100
  },
  {
    "language": "ar",
    "name": "Arabic",
    "total": 100,
    "translated": 85,
    "missing": 15,
    "percentage": 85
  }
]
```

## Database Schema

### Language
- code: Unique language code (en, ar, fr)
- name: English name
- nativeName: Native name
- direction: ltr or rtl
- enabled: Active status
- isDefault: Default language flag

### TranslationKey
- key: Unique translation key
- namespace: Grouping (common, auth, etc.)
- description: Optional description

### Translation
- keyId: Reference to TranslationKey
- langCode: Language code
- value: Translated text
- verified: Verification status

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Run migrations:
```bash
npm run migrate
```

4. Seed initial languages:
```bash
# Add via API or directly in database
```

5. Start service:
```bash
npm run dev
```

## Integration Examples

### Frontend - Get Translations
```typescript
// Get all translations for a language
const response = await fetch('/api/translations?lang=ar');
const { data } = await response.json();

// Use in your app
const t = (key: string) => data[namespace][key] || key;
```

### Frontend - Translate Key
```typescript
const response = await fetch('/api/translations/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'common.welcome',
    lang: 'ar'
  })
});

const { data } = await response.json();
console.log(data.translation); // "مرحبا"
```

### Backend - Add Translations
```typescript
await fetch('/api/translations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'product.add_to_cart',
    namespace: 'product',
    translations: {
      en: 'Add to Cart',
      ar: 'أضف إلى السلة',
      fr: 'Ajouter au panier'
    }
  })
});
```

## Supported Languages

Default setup includes:
- English (en) - LTR
- Arabic (ar) - RTL
- French (fr) - LTR

Add more via API.

## Port

**3026** - i18n Service

## Tech Stack

- Express.js
- Prisma ORM
- PostgreSQL
- i18next
- TypeScript
- Winston

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 4, 2026
