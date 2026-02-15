# CrafterCMS Integration for Mnbara Platform

A comprehensive content management system integration using CrafterCMS, providing headless CMS capabilities with personalization, multilingual support, and AI-powered content generation.

## 🚀 Features

### Core Content Management
- **Headless CMS**: GraphQL and REST API access to content
- **Content Modeling**: Flexible content type definitions
- **Version Control**: Git-based content versioning
- **Workflow Management**: Content approval and publishing workflows
- **Multi-site Management**: Support for multiple websites/locations

### Advanced Features
- **Personalization Engine**: AI-powered content personalization
- **Multilingual Support**: Content translation and localization
- **A/B Testing**: Built-in experimentation and optimization
- **AI Content Generation**: Automated content creation using OpenAI
- **Content Sync**: Bidirectional synchronization with existing databases
- **Real-time Search**: Elasticsearch-powered content discovery

### Developer Experience
- **TypeScript**: Full type safety
- **Docker Support**: Containerized deployment
- **Microservices Architecture**: Scalable and maintainable
- **Event-driven**: Real-time content updates
- **Caching**: Redis-based performance optimization

## 📋 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CrafterCMS    │    │  Content API    │    │   Mnbara DB     │
│   (Studio)      │◄──►│   Service       │◄──►│  (Products)     │
│   Port: 8080    │    │   Port: 3002    │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  CrafterCMS     │    │   Redis Cache   │    │   Event Bus     │
│  (Engine)       │    │   Port: 6379    │    │   Port: 6379    │
│   Port: 8081    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- PostgreSQL 15+ (for content sync)
- Redis 7+ (for caching and events)

### Quick Start

1. **Clone and setup**:
```bash
cd backend/services/craftercms
cp content-service/.env.example content-service/.env
# Edit .env with your configuration
```

2. **Start CrafterCMS**:
```bash
docker-compose up -d
```

3. **Start Content Service**:
```bash
cd content-service
npm install
npm run dev
```

## 📖 Usage

### Content API Endpoints

#### Get Content
```http
GET /api/v1/content/sites/{siteId}/content/{path}
```

#### Search Content
```http
POST /api/v1/content/sites/{siteId}/search
Content-Type: application/json

{
  "query": "product",
  "filters": {
    "contentType": ["product"],
    "category": ["electronics"]
  },
  "sort": [{"field": "price", "order": "desc"}],
  "limit": 20,
  "offset": 0
}
```

#### Update Content
```http
PUT /api/v1/content/sites/{siteId}/content/{path}
Content-Type: application/json

{
  "contentType": "product",
  "content": {
    "name": "New Product",
    "description": "Product description",
    "price": 99.99
  },
  "metadata": [
    {"key": "author", "value": "admin"}
  ]
}
```

#### Personalized Content
```http
POST /api/v1/content/sites/{siteId}/content/{contentId}/personalize
Content-Type: application/json

{
  "userProfile": {
    "id": "user123",
    "demographics": {
      "age": 25,
      "location": "US"
    },
    "interests": {
      "categories": ["electronics", "gadgets"]
    }
  },
  "context": {
    "timeOfDay": "evening",
    "device": {
      "type": "mobile"
    }
  }
}
```

### Content Models

#### Product Content Model
- Basic information (name, description, price)
- Inventory management
- Media gallery
- Variants and specifications
- SEO optimization
- Status and visibility controls

#### Blog Post Content Model
- Title and content
- Author and categories
- Featured images
- SEO settings
- Publishing controls
- Analytics integration

### Content Sync

#### Sync Product to CrafterCMS
```typescript
const syncService = new ContentSyncService(prisma, crafterClient, eventBus);
await syncService.syncProductToCrafterCMS('product123');
```

#### Batch Sync All Products
```typescript
const results = await syncService.syncAllProductsToCrafterCMS('mnbara', {
  status: ['published'],
  featured: true
});
```

### Personalization

#### Create Personalization Rule
```typescript
const ruleId = await personalizationEngine.createPersonalizationRule('mnbara', {
  name: 'New User Welcome',
  conditions: [
    {
      field: 'user.behavior',
      operator: 'equals',
      value: 'new-user'
    }
  ],
  modifications: {
    content: {
      welcomeMessage: 'Welcome to our platform!',
      showTutorial: true
    }
  }
});
```

### A/B Testing

#### Create A/B Test
```typescript
const testId = await abTestingService.createTest({
  name: 'Homepage Hero Banner',
  variants: [
    {
      id: 'control',
      name: 'Control',
      distribution: 0.5,
      content: { bannerText: 'Welcome to Mnbara' }
    },
    {
      id: 'variant-a',
      name: 'Variant A',
      distribution: 0.5,
      content: { bannerText: 'Discover Amazing Products' }
    }
  ]
});
```

### AI Content Generation

#### Generate Product Description
```typescript
const result = await aiContentService.generateProductDescription(
  'Wireless Headphones',
  ['Noise cancellation', '30-hour battery', 'Bluetooth 5.0'],
  'tech-savvy consumers',
  'persuasive'
);
```

#### Generate SEO Content
```typescript
const seoContent = await aiContentService.generateSEOContent(
  'Best Wireless Headphones 2024',
  ['wireless headphones', 'bluetooth headphones', 'noise cancelling'],
  'tech enthusiasts',
  'long'
);
```

### Multilingual Support

#### Translate Content
```typescript
const translatedContent = await multilingualService.translateContent(
  content,
  'en',
  'es',
  'openai'
);
```

#### Get Localized Content
```typescript
const spanishContent = await multilingualService.getLocalizedContent(
  'mnbara',
  '/products/headphones',
  'es',
  {
    fallbackToDefault: true,
    createIfNotExists: true
  }
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3002
NODE_ENV=development
LOG_LEVEL=info

# CrafterCMS Configuration
CRAFTER_STUDIO_URL=http://localhost:8080
CRAFTER_ENGINE_URL=http://localhost:8081
CRAFTER_AUTH_TOKEN=your-crafter-auth-token

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/mnbara

# Authentication
JWT_SECRET=your-jwt-secret-key-minimum-32-characters
API_KEY=your-api-key-for-service-communication

# AI Services
OPENAI_API_KEY=your-openai-api-key
```

### Docker Compose Services

#### CrafterCMS Stack
- **Crafter Studio**: Content authoring interface (port 8080)
- **Crafter Engine**: Content delivery (port 8081)
- **Crafter Deployer**: Content deployment service (port 9191)
- **PostgreSQL**: Primary database (port 5432)
- **Elasticsearch**: Search and analytics (port 9200)
- **Redis**: Caching and sessions (port 6379)
- **MongoDB**: Alternative NoSQL storage (port 27017)
- **Nginx**: Load balancer and reverse proxy (port 80/443)

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

## 📊 Monitoring

### Health Checks
```http
GET /health
```

### Metrics
- Response times
- Error rates
- Cache hit rates
- Content sync status
- A/B test performance

### Logging
- Request/response logging
- Error tracking
- Performance monitoring
- Content change audit trail

## 🔒 Security

### Authentication
- JWT-based authentication
- API key for service communication
- Role-based access control

### Authorization
- Content-level permissions
- Site-level access control
- Workflow approval requirements

### Data Protection
- Encryption at rest
- Secure API endpoints
- Input validation and sanitization

## 🚀 Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## 📈 Performance Optimization

### Caching Strategy
- Redis-based content caching
- CDN integration for static assets
- Database query optimization
- GraphQL query batching

### Scaling
- Horizontal scaling with load balancers
- Database read replicas
- Redis clustering
- Microservices architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📚 Documentation

- [CrafterCMS Documentation](https://docs.craftercms.org/)
- [GraphQL API Reference](docs/graphql-api.md)
- [Content Models Guide](docs/content-models.md)
- [Personalization Guide](docs/personalization.md)
- [A/B Testing Guide](docs/ab-testing.md)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🎯 Roadmap

- [ ] Advanced personalization with ML
- [ ] Visual content editor
- [ ] Content performance analytics
- [ ] Multi-channel content delivery
- [ ] Advanced workflow automation
- [ ] Content recommendation engine
- [ ] Real-time collaboration features