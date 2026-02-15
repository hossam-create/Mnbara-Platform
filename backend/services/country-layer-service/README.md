# 🌍 MNBARA COUNTRY LAYER ENGINE
**Service:** country-layer-service  
**Port:** 3015  
**Purpose:** Core country tracking and compliance engine  

## 🎯 SERVICE OVERVIEW

The Country Layer Engine is the heart of Mnbara's global marketplace, enabling:
- **Country Tracking:** origin → purchase → delivery
- **Compliance Rules:** Customs restrictions and quotas  
- **Risk Assessment:** Country-based risk scoring
- **Traveler Matching:** Route-based product filtering
- **Regulatory Reporting:** Customs and tax compliance

## 🏗️ ARCHITECTURE

```
Frontend Apps → API Gateway → Country Layer Engine → Database
                    ↓
            Product Service ← Traveler Service ← Matching Engine
```

## 📊 CORE RESPONSIBILITIES

### 1. Country Tracking
- Track product journey: **Origin → Purchase → Delivery**
- Validate country codes (ISO 3166-1 alpha-2)
- Maintain country metadata and relationships
- Support 195+ countries and territories

### 2. Compliance Rules
- **Customs Restrictions:** Product-specific country rules
- **Quantity Limits:** Maximum allowed per traveler
- **Category Restrictions:** Banned/restricted items by country
- **Documentation Requirements:** Required permits/certificates

### 3. Risk Assessment
- **Country Risk Scores:** Political/economic stability
- **Customs Complexity:** Processing difficulty ratings
- **Fraud Risk:** Country-based fraud probability
- **Regulatory Changes:** Real-time compliance updates

### 4. Traveler Matching
- **Route Validation:** From purchase to delivery country
- **Product Filtering:** Show only route-compatible items
- **Capacity Management:** Country-specific quantity limits
- **Compliance Checking:** Pre-match validation

### 5. Regulatory Reporting
- **Customs Declarations:** Automated form generation
- **Tax Calculations:** Country-specific duty/tax computation
- **Audit Trails:** Complete compliance history
- **Government APIs:** Integration with customs systems

## 🗃️ DATABASE SCHEMA

### Core Tables

#### `countries`
```sql
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  iso_code VARCHAR(2) UNIQUE NOT NULL,  -- ISO 3166-1 alpha-2
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  subregion VARCHAR(50),
  risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  customs_complexity INTEGER DEFAULT 3,    -- 1-5 scale
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `product_countries`
```sql
CREATE TABLE product_countries (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  origin_country VARCHAR(2) NOT NULL,      -- Where product was made
  purchase_country VARCHAR(2) NOT NULL,    -- Where buyer will purchase
  delivery_country VARCHAR(2) NOT NULL,    -- Where product will be delivered
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (origin_country) REFERENCES countries(iso_code),
  FOREIGN KEY (purchase_country) REFERENCES countries(iso_code),
  FOREIGN KEY (delivery_country) REFERENCES countries(iso_code)
);
```

#### `country_rules`
```sql
CREATE TABLE country_rules (
  id SERIAL PRIMARY KEY,
  country VARCHAR(2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  max_quantity INTEGER DEFAULT 1,
  max_value DECIMAL(10,2) DEFAULT 1000.00,
  is_restricted BOOLEAN DEFAULT false,
  requires_permit BOOLEAN DEFAULT false,
  permit_types TEXT[],
  restrictions TEXT,
  duty_rate DECIMAL(5,2) DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (country) REFERENCES countries(iso_code)
);
```

#### `traveler_routes`
```sql
CREATE TABLE traveler_routes (
  id SERIAL PRIMARY KEY,
  traveler_id VARCHAR(50) NOT NULL,
  from_country VARCHAR(2) NOT NULL,
  to_country VARCHAR(2) NOT NULL,
  departure_date DATE NOT NULL,
  arrival_date DATE NOT NULL,
  max_capacity_weight DECIMAL(10,2) DEFAULT 20.00, -- kg
  max_capacity_value DECIMAL(10,2) DEFAULT 2000.00, -- USD
  allowed_categories TEXT[],
  risk_tolerance VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_country) REFERENCES countries(iso_code),
  FOREIGN KEY (to_country) REFERENCES countries(iso_code)
);
```

#### `compliance_logs`
```sql
CREATE TABLE compliance_logs (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  route_id INTEGER NOT NULL,
  traveler_id VARCHAR(50) NOT NULL,
  buyer_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- compliant, restricted, rejected
  risk_score INTEGER DEFAULT 0, -- 0-100
  restrictions TEXT[],
  required_documents TEXT[],
  estimated_duty DECIMAL(10,2) DEFAULT 0.00,
  estimated_tax DECIMAL(10,2) DEFAULT 0.00,
  compliance_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES traveler_routes(id)
);
```

## 🔌 API ENDPOINTS

### Product Country Management
```
POST   /api/v1/countries/products           # Add country data to product
GET    /api/v1/countries/products/{id}      # Get product country info
PUT    /api/v1/countries/products/{id}      # Update product country data
DELETE /api/v1/countries/products/{id}      # Remove product country data
```

### Country Rules Management
```
GET    /api/v1/countries/rules              # Get all country rules
POST   /api/v1/countries/rules              # Create country rule
GET    /api/v1/countries/rules/{id}         # Get specific rule
PUT    /api/v1/countries/rules/{id}         # Update country rule
DELETE /api/v1/countries/rules/{id}         # Delete country rule
```

### Traveler Route Management
```
POST   /api/v1/countries/travelers/{id}/routes     # Create traveler route
GET    /api/v1/countries/travelers/{id}/routes     # Get traveler routes
PUT    /api/v1/countries/routes/{id}               # Update route
DELETE /api/v1/countries/routes/{id}               # Delete route
```

### Compliance & Validation
```
POST   /api/v1/countries/validate           # Validate product-route compliance
GET    /api/v1/countries/compliance/{id}    # Get compliance status
POST   /api/v1/countries/match              # Match products with travelers
GET    /api/v1/countries/risk/{country}     # Get country risk assessment
```

### Admin & Analytics
```
GET    /api/v1/countries/analytics          # Country compliance analytics
GET    /api/v1/countries/reports/compliance # Compliance reports
GET    /api/v1/countries/reports/routes     # Route analytics
GET    /api/v1/countries/reports/revenue    # Revenue by country
```

## 🧮 BUSINESS LOGIC

### Country Validation Algorithm
```typescript
async function validateProductRoute(product: Product, route: TravelerRoute): Promise<ComplianceResult> {
  // Step 1: Basic route validation
  if (route.from_country !== product.purchase_country || 
      route.to_country !== product.delivery_country) {
    return { status: 'invalid_route', message: 'Route does not match product countries' };
  }

  // Step 2: Check country rules
  const rules = await getCountryRules(product.delivery_country, product.category);
  
  if (rules.is_restricted) {
    return { status: 'restricted', restrictions: rules.restrictions };
  }

  // Step 3: Quantity validation
  if (product.quantity > rules.max_quantity) {
    return { status: 'quantity_exceeded', max_allowed: rules.max_quantity };
  }

  // Step 4: Value validation
  if (product.total_value > rules.max_value) {
    return { status: 'value_exceeded', max_allowed: rules.max_value };
  }

  // Step 5: Permit requirements
  if (rules.requires_permit && !product.has_permit) {
    return { status: 'permit_required', required_permits: rules.permit_types };
  }

  // Step 6: Risk assessment
  const riskScore = await calculateRiskScore(product, route);
  
  return {
    status: 'compliant',
    risk_score: riskScore,
    estimated_duty: rules.duty_rate * product.total_value,
    estimated_tax: rules.tax_rate * product.total_value,
    required_documents: rules.requires_permit ? rules.permit_types : []
  };
}
```

### Smart Matching Algorithm
```typescript
async function matchProductsWithTravelers(productId: string): Promise<TravelerMatch[]> {
  const product = await getProductWithCountries(productId);
  const availableRoutes = await getActiveTravelerRoutes(
    product.purchase_country,
    product.delivery_country
  );

  return availableRoutes.map(route => {
    const compliance = await validateProductRoute(product, route);
    
    return {
      traveler_id: route.traveler_id,
      route_id: route.id,
      compliance_status: compliance.status,
      risk_score: compliance.risk_score || 0,
      estimated_costs: {
        duty: compliance.estimated_duty || 0,
        tax: compliance.estimated_tax || 0
      },
      confidence_score: calculateConfidenceScore(product, route, compliance),
      match_reasoning: generateMatchReasoning(product, route, compliance)
    };
  }).filter(match => match.compliance_status === 'compliant')
    .sort((a, b) => b.confidence_score - a.confidence_score);
}
```

## 🎛️ CONTROL CENTER INTEGRATION

### Country Compliance Dashboard
```typescript
// Dashboard widgets for Control Center
const countryDashboard = {
  overview: {
    total_countries: 195,
    active_routes: 1250,
    compliance_rate: 94.5,
    risk_score_avg: 3.2
  },
  
  alerts: {
    high_risk_routes: 23,
    restricted_products: 156,
    permit_required: 89,
    compliance_violations: 12
  },
  
  analytics: {
    top_routes: getTopCountryPairs(),
    revenue_by_country: getRevenueByCountry(),
    compliance_trends: getComplianceTrends(),
    risk_distribution: getRiskDistribution()
  },
  
  actions: {
    update_rules: 'Update country rules',
    review_violations: 'Review violations',
    generate_report: 'Generate compliance report',
    export_data: 'Export country data'
  }
};
```

## 🔒 SECURITY & COMPLIANCE

### Data Protection
- **Encryption at Rest:** AES-256 for sensitive country data
- **Encryption in Transit:** TLS 1.3 for all API communications
- **Access Control:** Role-based permissions for country rules
- **Audit Logging:** Complete compliance audit trail

### Regulatory Compliance
- **GDPR:** European data protection compliance
- **PCI DSS:** Payment card industry standards
- **Customs Regulations:** Integration with government APIs
- **Trade Compliance:** OFAC, sanctions, and restricted parties

### Risk Management
- **Fraud Detection:** Country-based fraud patterns
- **Sanctions Screening:** Real-time restricted party checks
- **Export Controls:** Dual-use goods and technology controls
- **Anti-Money Laundering:** Suspicious activity monitoring

## 📊 PERFORMANCE METRICS

### Key Performance Indicators
- **Response Time:** < 200ms for country validation
- **Accuracy:** 99.9% compliance rule enforcement
- **Availability:** 99.9% uptime SLA
- **Throughput:** 10,000+ validations per second

### Monitoring Metrics
- **Validation Success Rate:** Percentage of compliant products
- **Route Utilization:** Active vs available traveler routes
- **Compliance Violations:** Number and types of violations
- **Revenue Impact:** Country-specific revenue and fees

## 🚀 DEPLOYMENT

### Environment Variables
```bash
# Database
COUNTRY_DB_HOST=localhost
COUNTRY_DB_PORT=5432
COUNTRY_DB_NAME=mnbara_country
COUNTRY_DB_USER=country_user
COUNTRY_DB_PASSWORD=secure_password

# Redis
COUNTRY_REDIS_HOST=localhost
COUNTRY_REDIS_PORT=6379
COUNTRY_REDIS_DB=1

# API
COUNTRY_SERVICE_PORT=3015
COUNTRY_SERVICE_HOST=0.0.0.0

# Security
COUNTRY_JWT_SECRET=your_jwt_secret
COUNTRY_ENCRYPTION_KEY=your_encryption_key

# External Services
COUNTRY_GOV_API_KEY=your_government_api_key
COUNTRY_SANCTIONS_API_URL=https://api.sanctions.gov
```

### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S country && adduser -S country -u 1001
USER country

# Expose port
EXPOSE 3015

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3015/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
```

## 📞 SUPPORT

### Technical Documentation
- **API Documentation:** http://localhost:3015/docs
- **Database Schema:** docs/database-schema.md
- **Deployment Guide:** docs/deployment.md
- **Troubleshooting:** docs/troubleshooting.md

### Contact Information
- **Technical Support:** tech@mnbara.com
- **Compliance Questions:** compliance@mnbara.com
- **Emergency Issues:** emergency@mnbara.com

---

**Status:** 🟢 Active Development  
**Last Updated:** February 13, 2026  
**Version:** 1.0.0  
**Next Review:** March 13, 2026