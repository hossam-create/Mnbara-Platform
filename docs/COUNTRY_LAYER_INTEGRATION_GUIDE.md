# Country Layer Integration Guide

## Overview

The Country Layer Engine (COOL) provides comprehensive country-based compliance, risk assessment, and routing validation for the Mnbara platform. This guide covers integration with all major services.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Country Layer Engine                        │
│                    Port: 3015                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Countries   │  │ Compliance   │  │ Traveler Routes  │   │
│  │ Management  │  │ Rules        │  │ Management       │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Route       │  │ Risk         │  │ Product Country  │   │
│  │ Validation  │  │ Assessment   │  │ Validation       │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Integrated Services                           │
├─────────────────────────────────────────────────────────────────┤
│  Product Service │ Traveler Service │ Matching Engine         │
│  Port: 3001      │ Port: 3002      │ Port: 3003              │
└─────────────────────────────────────────────────────────────────┘
```

## Service Integration Points

### 1. Product Service Integration

#### Country Fields Added
```typescript
interface Product {
  originCountry: string;      // ISO 3166-1 alpha-2 (e.g., 'US')
  purchaseCountry: string;  // ISO 3166-1 alpha-2 (e.g., 'SA')
  deliveryCountry: string;  // ISO 3166-1 alpha-2 (e.g., 'AE')
}
```

#### Validation Flow
```typescript
// During product creation/update
const validation = await countryLayerClient.validateProductRoute(
  productId,
  destinationCountry
);

if (validation.complianceStatus === 'prohibited') {
  throw new Error('Product route is prohibited');
}

if (validation.riskLevel === 'critical') {
  // Log warning and continue with enhanced monitoring
  logger.warn('High-risk product route detected', {
    productId,
    riskScore: validation.riskScore,
    issues: validation.issues
  });
}
```

### 2. Traveler Service Integration

#### Enhanced Route Management
```typescript
interface TravelerRoute {
  originCountry: string;
  destinationCountry: string;
  travelDate: Date;
  returnDate?: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceStatus: 'approved' | 'restricted' | 'prohibited';
}
```

#### Route Validation
```typescript
// Add traveler route with validation
const route = await countryLayerClient.addTravelerRoute(travelerId, {
  originCountry: 'US',
  destinationCountry: 'SA',
  travelDate: new Date('2024-02-01'),
  returnDate: new Date('2024-02-15')
});

// Check country restrictions
const isRestricted = await countryLayerClient.isCountryRestricted('IR');
if (isRestricted) {
  throw new Error('Travel to Iran is restricted');
}
```

### 3. Matching Engine Integration

#### Country-Based Matching Algorithm
```typescript
// Enhanced matching with country compatibility
const matchScore = calculateMatchScore(order, trip) + 
  countryLayerClient.calculateCountryCompatibilityScore(
    order.pickupCountry,
    order.deliveryCountry,
    trip.originCountry,
    trip.destCountry
  );

// Route validation before matching
const routeValidation = await countryLayerClient.validateTravelRoute(
  order.pickupCountry,
  order.deliveryCountry
);

if (routeValidation.complianceStatus === 'prohibited') {
  return { matches: [], message: 'Route is prohibited' };
}
```

## API Endpoints

### Country Management
- `GET /api/v1/countries` - List all countries
- `GET /api/v1/countries/:code` - Get country by code
- `POST /api/v1/countries` - Create new country
- `PUT /api/v1/countries/:code` - Update country
- `DELETE /api/v1/countries/:code` - Delete country

### Route Validation
- `POST /api/v1/countries/validate-route` - Validate travel route
- `POST /api/v1/countries/validate-product-route` - Validate product route

### Compliance Rules
- `GET /api/v1/rules` - List all compliance rules
- `POST /api/v1/rules` - Create new rule
- `PUT /api/v1/rules/:ruleId` - Update rule
- `DELETE /api/v1/rules/:ruleId` - Delete rule

### Traveler Routes
- `GET /api/v1/travelers/:travelerId/routes` - Get traveler routes
- `POST /api/v1/travelers/:travelerId/routes` - Add traveler route
- `DELETE /api/v1/travelers/:travelerId/routes/:routeId` - Remove route

### Compliance Monitoring
- `GET /api/v1/compliance-logs` - Get compliance logs
- `GET /api/v1/compliance-logs/:logId` - Get specific log

## Database Schema

### Countries Table
```sql
CREATE TABLE countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  currency VARCHAR(3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Country Rules Table
```sql
CREATE TABLE country_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(2) REFERENCES countries(code),
  rule_type VARCHAR(20) CHECK (rule_type IN ('import', 'export', 'customs', 'restricted', 'prohibited')),
  product_type VARCHAR(50),
  description TEXT NOT NULL,
  description_ar TEXT,
  severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Product Countries Table
```sql
CREATE TABLE product_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  country_code VARCHAR(2) REFERENCES countries(code),
  country_type VARCHAR(10) CHECK (country_type IN ('origin', 'purchase', 'delivery')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, country_code, country_type)
);
```

## Risk Assessment Framework

### Risk Levels
- **Low (0-30)**: Safe for trade, no restrictions
- **Medium (31-60)**: Minor restrictions, monitor closely
- **High (61-80)**: Significant restrictions, enhanced compliance required
- **Critical (81-100)**: Prohibited or severely restricted

### Risk Factors
1. **Country Sanctions**: UN, EU, US sanctions
2. **Trade Restrictions**: Import/export limitations
3. **Customs Complexity**: Documentation requirements
4. **Political Stability**: Government stability index
5. **Currency Risk**: Exchange rate volatility
6. **Logistics Risk**: Infrastructure quality

## Integration Checklist

### Product Service
- [x] Add country fields to Product schema
- [x] Implement country validation in create/update flows
- [x] Add country-based filtering
- [x] Integrate with country layer client
- [ ] Run database migrations
- [ ] Test country validation scenarios

### Traveler Service
- [x] Add country fields to Trip and Stopover schemas
- [x] Implement traveler route management
- [x] Add country restriction validation
- [x] Integrate with country layer client
- [ ] Run database migrations
- [ ] Test route validation scenarios

### Matching Engine
- [x] Add country-based scoring algorithm
- [x] Implement route validation before matching
- [x] Add country compatibility scoring
- [x] Integrate with country layer client
- [ ] Test matching scenarios with country restrictions
- [ ] Performance test country-based queries

### Admin Dashboard
- [x] Create country monitoring dashboard
- [x] Implement real-time compliance monitoring
- [x] Add country rule management interface
- [ ] Connect to live country layer service
- [ ] Add country analytics and reporting

## Testing Scenarios

### Product Validation
1. **Valid Product Route**: US → SA (electronics)
2. **Restricted Product**: Alcohol to Saudi Arabia
3. **High-Risk Route**: China → US (technology)
4. **Prohibited Route**: Iran → Any country

### Traveler Route Validation
1. **Valid Travel Route**: US → UAE
2. **Restricted Travel**: Any route to Iran
3. **High-Risk Travel**: Russia → EU countries
4. **Complex Route**: Multi-country with stopovers

### Matching Validation
1. **Perfect Country Match**: Product and traveler same route
2. **Partial Match**: Same origin, different destination
3. **Risk-Adjusted Match**: High-risk route with premium pricing
4. **Prohibited Match**: Blocked due to country restrictions

## Monitoring and Alerts

### Key Metrics
- Compliance rate (target: >95%)
- Route validation success rate
- Country restriction violations
- Risk score distribution
- Processing latency (<500ms)

### Alert Conditions
- Compliance rate drops below 90%
- Critical risk routes detected
- Country service unavailable
- High volume of validation failures
- New restricted countries added

## Deployment Notes

### Environment Variables
```bash
COUNTRY_LAYER_SERVICE_URL=http://localhost:3015/api/v1
COUNTRY_LAYER_SERVICE_TOKEN=your-jwt-token
COUNTRY_LAYER_TIMEOUT=5000
COUNTRY_LAYER_RETRIES=3
```

### Database Migrations
Run migrations in this order:
1. Country Layer Service migrations
2. Product Service country fields migration
3. Traveler Service country fields migration
4. Matching Engine schema updates

### Service Dependencies
```
Country Layer Service (Port 3015)
  ├── Product Service (Port 3001)
  ├── Traveler Service (Port 3002)
  └── Matching Engine (Port 3003)
```

## Troubleshooting

### Common Issues
1. **Country validation failing**: Check country layer service availability
2. **High risk scores**: Review country rules configuration
3. **Matching not finding travelers**: Verify country compatibility scoring
4. **Database constraint errors**: Ensure ISO country code format

### Debug Endpoints
- `GET /api/v1/health` - Country layer health check
- `GET /api/v1/countries/:code/rules` - Country-specific rules
- `GET /api/v1/compliance-logs/recent` - Recent validation logs

## Support and Maintenance

### Regular Tasks
- Update country rules based on policy changes
- Monitor compliance metrics
- Review restricted country list
- Update risk assessment algorithms
- Performance optimization

### Emergency Procedures
- Country service failover
- Manual country restriction updates
- Compliance log analysis
- Route validation bypass (emergency only)

---

For technical support, contact: engineering@mnbara.com
For policy updates, contact: compliance@mnbara.com