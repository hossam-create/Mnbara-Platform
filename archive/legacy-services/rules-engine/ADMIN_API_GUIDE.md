# Admin Visibility API Guide

## 🎯 **TASK 5 — Admin Visibility (Read Only)**

### **ABSOLUTE REQUIREMENTS**
- ✅ **READ ONLY access** - No editing or control capabilities
- ✅ **Visibility only** - Statistics and monitoring
- ✅ **NO editing rules** - Cannot modify rule configurations
- ✅ **NO disabling rules** - Cannot enable/disable rules
- ✅ **NO UI control** - No administrative control endpoints

---

## 📊 **Admin Endpoints**

### **GET /api/v1/admin/rules/evaluations**

Returns rule evaluation statistics for admin visibility.

#### **Response Format**
```json
{
  "evaluations": [
    {
      "ruleId": "USER_MAX_ACTIVE_BIDS",
      "ruleDescription": "Flags users who exceed the maximum number of active bids",
      "counts": {
        "allow": 15,
        "deny": 0,
        "flag": 8,
        "total": 23
      },
      "lastTriggeredAt": "2025-01-17T16:30:00.000Z",
      "severity": "MEDIUM"
    }
  ],
  "summary": {
    "totalRules": 4,
    "totalEvaluations": 156,
    "lastUpdated": "2025-01-17T16:45:00.000Z"
  },
  "generatedAt": "2025-01-17T16:45:15.123Z"
}
```

#### **Fields**
- **ruleId**: Unique identifier for the rule
- **ruleDescription**: Human-readable description of the rule
- **counts**: Evaluation result statistics
  - **allow**: Number of ALLOW results
  - **deny**: Number of DENY results  
  - **flag**: Number of FLAG results
  - **total**: Total number of evaluations
- **lastTriggeredAt**: Timestamp of last rule evaluation
- **severity**: Rule severity level (LOW/MEDIUM/HIGH/CRITICAL)

---

### **GET /api/v1/admin/rules/evaluations/summary**

Returns summary statistics for all rule evaluations.

#### **Response Format**
```json
{
  "summary": {
    "totalRules": 4,
    "totalEvaluations": 156,
    "totalAllows": 120,
    "totalDenies": 8,
    "totalFlags": 28
  },
  "generatedAt": "2025-01-17T16:45:15.123Z"
}
```

---

### **GET /api/v1/admin/rules/evaluations/:ruleId**

Returns statistics for a specific rule.

#### **Response Format**
```json
{
  "ruleId": "USER_MAX_ACTIVE_BIDS",
  "ruleDescription": "Flags users who exceed the maximum number of active bids",
  "ruleSeverity": "MEDIUM",
  "counts": {
    "allow": 15,
    "deny": 0,
    "flag": 8,
    "total": 23
  },
  "lastTriggeredAt": "2025-01-17T16:30:00.000Z",
  "generatedAt": "2025-01-17T16:45:15.123Z"
}
```

#### **Error Responses**
```json
// 404 - Rule not found
{
  "error": "Not found",
  "message": "Rule 'NON_EXISTENT_RULE' not found or has no evaluations"
}

// 400 - Bad request
{
  "error": "Bad request", 
  "message": "Rule ID is required"
}
```

---

## 🔒 **READ ONLY Guarantee**

### **What Admin API Provides**
- ✅ **Visibility** - View rule evaluation statistics
- ✅ **Monitoring** - Track rule performance and patterns
- ✅ **Auditing** - Complete evaluation history
- ✅ **Analytics** - Decision trends and frequencies

### **What Admin API Does NOT Provide**
- ❌ **Rule Editing** - Cannot modify rule logic
- ❌ **Rule Disabling** - Cannot enable/disable rules
- ❌ **Configuration Changes** - Cannot adjust thresholds
- ❌ **Control Operations** - No administrative control
- ❌ **Data Modification** - Cannot change any data

### **Security Model**
```typescript
// READ ONLY - No modification methods
class AdminStatistics {
  // ✅ READ ONLY methods
  getAllRuleStats(): RuleStatistics[]
  getRuleStats(ruleId: string): RuleStatistics | null
  getAdminEvaluationsResponse(): AdminEvaluationsResponse
  getSummaryStats(): SummaryStats
  
  // ❌ NO modification methods (except internal tracking)
  // NO updateRule(), deleteRule(), disableRule(), etc.
  // Only updateRuleStats() for internal tracking
}
```

---

## 📈 **Usage Examples**

### **Monitor Rule Performance**
```bash
# Get all rule evaluations
curl -X GET "http://localhost:3000/api/v1/admin/rules/evaluations" \
  -H "Authorization: Bearer <admin-token>"

# Get summary statistics
curl -X GET "http://localhost:3000/api/v1/admin/rules/evaluations/summary" \
  -H "Authorization: Bearer <admin-token>"

# Get specific rule statistics
curl -X GET "http://localhost:3000/api/v1/admin/rules/evaluations/USER_MAX_ACTIVE_BIDS" \
  -H "Authorization: Bearer <admin-token>"
```

### **Integration with Admin Dashboard**
```typescript
// React component example
function RuleEvaluationsDashboard() {
  const [evaluations, setEvaluations] = useState(null);
  
  useEffect(() => {
    fetch('/api/v1/admin/rules/evaluations', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setEvaluations(data));
  }, []);

  return (
    <div>
      <h2>Rule Evaluations</h2>
      {evaluations?.evaluations.map(rule => (
        <div key={rule.ruleId}>
          <h3>{rule.ruleId}</h3>
          <p>{rule.ruleDescription}</p>
          <div>
            <span>Allow: {rule.counts.allow}</span>
            <span>Flag: {rule.counts.flag}</span>
            <span>Deny: {rule.counts.deny}</span>
          </div>
          <small>Last: {rule.lastTriggeredAt}</small>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 **Integration Setup**

### **1. Install Dependencies**
```bash
cd backend/services/rules-engine
npm install express
npm install --save-dev @types/express
```

### **2. Add Admin Routes to Main App**
```typescript
// In your main Express app
import { adminRoutes } from '@mnbara/rules-engine';

app.use('/api/v1/admin/rules', adminRoutes);
```

### **3. Add Authentication Middleware**
```typescript
// Add admin authentication before routes
app.use('/api/v1/admin/rules', 
  authenticateAdmin, // Your auth middleware
  authorizeAdmin,    // Your authorization middleware
  adminRoutes
);
```

---

## 📊 **Data Tracking**

### **Automatic Statistics Collection**
- **Real-time Updates** - Statistics updated on every rule evaluation
- **Persistent Tracking** - Data survives service restarts (if implemented)
- **Memory Efficient** - Optimized for high-volume evaluations
- **Thread Safe** - Concurrent evaluation support

### **Tracked Metrics**
- **Evaluation Counts** - ALLOW/DENY/FLAG totals per rule
- **Timestamps** - Last evaluation time per rule
- **Rule Metadata** - Description and severity
- **Summary Statistics** - Aggregate metrics across all rules

### **Data Retention**
- **In-Memory** - Current session statistics
- **Log Files** - Complete evaluation history via append-only logging
- **Export Capability** - Statistics can be exported for analysis

---

## 🚨 **Error Handling**

### **HTTP Status Codes**
- **200** - Success
- **400** - Bad request (missing parameters)
- **404** - Rule not found
- **500** - Internal server error

### **Error Response Format**
```json
{
  "error": "Error Type",
  "message": "Human-readable error description"
}
```

### **Graceful Degradation**
- **Service Unavailable** - Returns cached data if available
- **Partial Failures** - Returns available data, indicates missing portions
- **Empty Results** - Returns empty arrays for no-data scenarios

---

## 📋 **Monitoring Dashboard**

### **Key Metrics to Monitor**
1. **High FLAG Rates** - Rules triggering frequent flags
2. **High DENY Rates** - Rules blocking many actions
3. **Inactive Rules** - Rules with no recent evaluations
4. **Performance Trends** - Evaluation patterns over time
5. **Error Rates** - Rule evaluation failures

### **Alert Thresholds**
```typescript
// Example monitoring alerts
const alerts = {
  highFlagRate: { threshold: 0.2, rule: 'FLAG_RATE > 20%' },
  highDenyRate: { threshold: 0.1, rule: 'DENY_RATE > 10%' },
  inactiveRule: { threshold: 3600000, rule: 'NO_EVALUATION > 1_HOUR' },
  errorRate: { threshold: 0.05, rule: 'ERROR_RATE > 5%' }
};
```

---

## 🔍 **Audit Trail**

### **Complete Evaluation History**
```typescript
// All evaluations logged with append-only guarantee
const logEntry = {
  timestamp: "2025-01-17T16:30:00.000Z",
  level: "INFO",
  event: "RULE_EVALUATION",
  data: {
    ruleId: "USER_MAX_ACTIVE_BIDS",
    result: "FLAG",
    reason: "User has 15 active bids, exceeding the maximum allowed of 10",
    severity: "MEDIUM",
    evaluatedAt: "2025-01-17T16:30:00.000Z"
  }
};
```

### **Compliance Features**
- **Immutable Logs** - Append-only, never modified
- **Complete Traceability** - Every evaluation recorded
- **Timestamp Accuracy** - Precise timing for audit requirements
- **Data Integrity** - No data loss or corruption

---

## 🎯 **Production Deployment**

### **Performance Considerations**
- **Memory Usage** - Statistics stored in memory for fast access
- **Concurrent Access** - Thread-safe for multiple admin users
- **Response Times** - Sub-second response for all endpoints
- **Scalability** - Handles high evaluation volumes

### **Security Best Practices**
- **Authentication Required** - Admin-only access
- **Authorization Checks** - Role-based access control
- **Rate Limiting** - Prevent abuse of admin endpoints
- **Audit Logging** - All admin access logged

### **Monitoring Setup**
```typescript
// Health check endpoint
app.get('/api/v1/admin/rules/health', (req, res) => {
  const stats = adminStatistics.getSummaryStats();
  res.json({
    status: 'healthy',
    statistics: stats,
    timestamp: new Date()
  });
});
```

---

## 📝 **Summary**

The Admin Visibility API provides **complete READ ONLY access** to rule evaluation statistics without any control capabilities. This ensures:

- ✅ **Transparency** - Full visibility into rule performance
- ✅ **Accountability** - Complete audit trail
- ✅ **Security** - No risk of accidental rule modification
- ✅ **Compliance** - Meets regulatory requirements for audit trails
- ✅ **Monitoring** - Real-time insights into system behavior

**Perfect for**: Admin dashboards, monitoring systems, compliance reporting, and operational oversight without the risk of configuration changes.
