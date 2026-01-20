# Mnbara Rules Engine - Basic Implementation

**Phase 3 — Rules Engine (Basic)**

A deterministic rules engine for financial marketplace decisions without side effects.

## 🎯 Goal

Prevent any random decisions or hardcoded logic. Every decision remains a Rule that is:
- ✅ **Logged** + **Traceable**
- ❌ **No AI** - **No complexity**
- 🔒 **Backend-only** - **Frontend has ZERO authority**

## 🧩 Core Features

### 1. Rule Interface
```typescript
interface Rule {
  id: string;
  description: string;
  appliesTo: Array<{
    actorType?: string;
    targetType?: string;
    actionType?: string;
  }>;
  severity?: RuleSeverity;
  evaluate(context: RuleContext): Promise<RuleEvaluationResult>;
}
```

### 2. Rule Results
```typescript
enum RuleResult {
  ALLOW = 'ALLOW',
  DENY = 'DENY', 
  FLAG = 'FLAG'
}
```

### 3. Generic Context
```typescript
interface RuleContext {
  actor: {
    id: string;
    type: 'USER' | 'SYSTEM' | 'ADMIN' | 'SERVICE';
    metadata?: Record<string, any>;
  };
  target: {
    id: string;
    type: 'USER' | 'AUCTION' | 'TRANSACTION' | 'LISTING' | 'PAYMENT' | 'WALLET';
    metadata?: Record<string, any>;
  };
  action: {
    type: 'BID' | 'PAY' | 'LIST' | 'WITHDRAW' | 'TRANSFER' | 'REGISTER' | 'LOGIN';
    metadata?: Record<string, any>;
  };
  environment: {
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}
```

## 🔧 Rules Engine Service

### Core Methods
- `registerRule(rule, options?)` - Register a new rule
- `evaluate(context)` - Evaluate all applicable rules
- `getApplicableRules(context)` - Get rules that match context
- `getEvaluationLog(limit?)` - Get evaluation history
- `getStatistics()` - Get engine statistics

### Key Principles
- ✅ **Deterministic** - No randomness, no ML
- ✅ **No Side Effects** - Never moves money or executes actions
- ✅ **Decision Only** - Returns ALLOW/DENY/FLAG
- ✅ **Full Logging** - Every evaluation logged
- ✅ **Immutable Context** - Input never modified

## 📋 Example Rules

### 1. User Registration Limit
Prevents duplicate user registrations
```typescript
const UserRegistrationLimitRule: Rule = {
  id: 'user-registration-limit',
  description: 'Prevents duplicate user registrations',
  appliesTo: [{ actionType: 'REGISTER' }],
  severity: RuleSeverity.HIGH,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const hasExistingAccount = context.actor.metadata?.hasExistingAccount ?? false;
    
    if (hasExistingAccount) {
      return {
        ruleId: this.id,
        result: RuleResult.DENY,
        reason: 'User already has an existing account',
        severity: RuleSeverity.HIGH,
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'New user registration allowed',
      evaluatedAt: new Date()
    };
  }
};
```

### 2. Suspicious Bidding Pattern
Flags unusual bidding activity
```typescript
const SuspiciousBiddingPatternRule: Rule = {
  id: 'suspicious-bidding-pattern',
  description: 'Flags users with unusual bidding patterns',
  appliesTo: [{ actorType: 'USER' }, { actionType: 'BID' }],
  severity: RuleSeverity.MEDIUM,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const bidCount = context.action.metadata?.bidCount ?? 1;
    const timeWindow = context.action.metadata?.timeWindowMinutes ?? 1;
    
    if (bidCount > 10 && timeWindow <= 5) {
      return {
        ruleId: this.id,
        result: RuleResult.FLAG,
        reason: `User placed ${bidCount} bids in ${timeWindow} minutes`,
        severity: RuleSeverity.MEDIUM,
        metadata: { bidCount, timeWindow, threshold: 10 },
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'Normal bidding pattern detected',
      evaluatedAt: new Date()
    };
  }
};
```

### 3. Blacklisted IP
Blocks actions from blacklisted IPs
```typescript
const BlacklistedIPRule: Rule = {
  id: 'blacklisted-ip',
  description: 'Blocks actions from blacklisted IP addresses',
  appliesTo: [], // Applies to all actions
  severity: RuleSeverity.CRITICAL,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const clientIP = context.environment.ip;
    const blacklistedIPs = ['192.168.1.100', '10.0.0.50'];
    
    if (clientIP && blacklistedIPs.includes(clientIP)) {
      return {
        ruleId: this.id,
        result: RuleResult.DENY,
        reason: `Action from blacklisted IP address: ${clientIP}`,
        severity: RuleSeverity.CRITICAL,
        metadata: { clientIP, blacklistedIPs },
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'IP address not blacklisted',
      evaluatedAt: new Date()
    };
  }
};
```

## 📋 Core Rules

### 1. USER_MAX_ACTIVE_BIDS
- **Purpose**: Flags users who exceed maximum active bids
- **Default Threshold**: 10 active bids
- **Result**: FLAG
- **Configuration**: 
  ```bash
  RULE_USER_MAX_ACTIVE_BIDS=10
  RULE_USER_MAX_ACTIVE_BIDS_SEVERITY=MEDIUM
  ```

### 2. TRAVELER_MAX_PENDING_REQUESTS  
- **Purpose**: Denies travelers who exceed maximum pending requests
- **Default Threshold**: 5 pending requests
- **Result**: DENY
- **Configuration**:
  ```bash
  RULE_TRAVELER_MAX_PENDING_REQUESTS=5
  RULE_TRAVELER_MAX_PENDING_REQUESTS_SEVERITY=HIGH
  ```

### 3. SELLER_LISTING_RATE_LIMIT
- **Purpose**: Flags sellers who create listings too frequently
- **Default Thresholds**: 5 per hour, 50 per day
- **Result**: FLAG
- **Configuration**:
  ```bash
  RULE_SELLER_MAX_LISTINGS_PER_HOUR=5
  RULE_SELLER_MAX_LISTINGS_PER_DAY=50
  RULE_SELLER_LISTING_RATE_LIMIT_SEVERITY=MEDIUM
  ```

### 4. PAYMENT_RETRY_LIMIT
- **Purpose**: Denies payments that exceed maximum retry attempts
- **Default Thresholds**: 3 retries within 60 minutes
- **Result**: DENY
- **Configuration**:
  ```bash
  RULE_PAYMENT_MAX_RETRIES=3
  RULE_PAYMENT_RETRY_WINDOW_MINUTES=60
  RULE_PAYMENT_RETRY_LIMIT_SEVERITY=HIGH
  ```

## 🚀 Usage Example

```typescript
import { RulesEngine, coreRules, RuleContext } from '@mnbara/rules-engine';

// Initialize engine
const engine = new RulesEngine();

// Register core rules
coreRules.forEach(rule => engine.registerRule(rule));

// Create context for user bidding
const context: RuleContext = {
  actor: { 
    id: 'user-123', 
    type: 'USER',
    metadata: { ['activeBids']: 12 } // Exceeds default limit
  },
  target: { 
    id: 'auction-456', 
    type: 'AUCTION' 
  },
  action: { 
    type: 'BID',
    metadata: { amount: 500 }
  },
  environment: { 
    timestamp: new Date(),
    ip: '203.0.113.1'
  }
};

// Evaluate rules
const result = await engine.evaluate(context);

console.log('Final Decision:', result.finalDecision); // FLAG
console.log('Summary:', result.summary); // { total: 1, allow: 0, deny: 0, flag: 1 }
```

## 📊 Output Format

```typescript
interface RuleEngineEvaluationSummary {
  context: RuleContext;
  results: RuleEvaluationResult[];
  summary: {
    total: number;
    allow: number;
    deny: number;
    flag: number;
  };
  finalDecision: RuleResult;
  evaluatedAt: Date;
}
```

## 🛡️ Security Guarantees

### ✅ ABSOLUTE RULES
- **Frontend has ZERO authority** - All decisions made backend-only
- **Rules NEVER move money** - Only return decisions
- **Rules only RETURN decisions** - ALLOW / DENY / FLAG
- **Every rule evaluation MUST be logged** - Complete audit trail
- **Rules are deterministic** - No ML, no randomness

### ✅ NO SIDE EFFECTS
- No wallet modifications
- No escrow operations  
- No ledger changes
- No auto-enforcement
- No external API calls

### ✅ IMMUTABLE CONTEXT
- Input context never modified
- Pure function evaluation
- Predictable results
- Thread-safe operations

## 🧪 Testing

Comprehensive test suite covering:
- Rule registration and management
- Context applicability filtering
- Rule evaluation logic
- Error handling and edge cases
- Deterministic behavior validation
- No side effects verification
- Evaluation logging
- Statistics tracking

Run tests:
```bash
npm test
npm run test:coverage
```

## 📈 Performance

- **O(1) rule lookup** with HashMap
- **Parallel evaluation** of applicable rules
- **Priority-based ordering** for consistent results
- **Memory-efficient logging** with circular buffer
- **Sub-millisecond evaluation** for typical rule sets

## 🔧 Installation

```bash
cd backend/services/rules-engine
npm install
npm run build
```

## 📦 Dependencies

- **TypeScript** - Type safety and interfaces
- **UUID** - Unique identifier generation
- **Jest** - Testing framework
- **ESLint** - Code quality

## 🎯 Next Steps

This basic implementation provides:
- ✅ Complete rule evaluation framework
- ✅ Deterministic decision making
- ✅ Full audit logging
- ✅ Example rules for common scenarios
- ✅ Comprehensive test coverage
- ✅ Production-ready TypeScript code

Ready for integration with existing Mnbara Platform services and expansion with additional business rules.
