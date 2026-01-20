# Compliance & AML/KYC - System Architecture Design

## 1. KYC VERIFICATION LEVELS

### KYC Schema

```sql
CREATE TABLE kyc_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Verification levels
  kyc_level ENUM('UNVERIFIED', 'BASIC', 'INTERMEDIATE', 'FULL'),
  kyc_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'),
  
  -- Personal info
  full_name VARCHAR(255),
  date_of_birth DATE,
  nationality VARCHAR(3),
  
  -- Address
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(3),
  
  -- Document verification
  id_document_type ENUM('PASSPORT', 'DRIVER_LICENSE', 'NATIONAL_ID'),
  id_document_number VARCHAR(50),
  id_document_expiry DATE,
  id_document_verified BOOLEAN,
  
  -- Proof of address
  address_document_type ENUM('UTILITY_BILL', 'BANK_STATEMENT', 'LEASE'),
  address_document_verified BOOLEAN,
  
  -- Risk assessment
  risk_score DECIMAL(5,2), -- 0-100
  risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  CONSTRAINT kyc_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_kyc_user ON kyc_profiles(user_id);
CREATE INDEX idx_kyc_level ON kyc_profiles(kyc_level);
CREATE INDEX idx_kyc_status ON kyc_profiles(kyc_status);
CREATE INDEX idx_kyc_risk ON kyc_profiles(risk_level);
```

---

### KYC Levels

```typescript
interface KYCLevel {
  level: 'UNVERIFIED' | 'BASIC' | 'INTERMEDIATE' | 'FULL';
  
  // Limits
  dailyTransactionLimit: Decimal;
  monthlyTransactionLimit: Decimal;
  maxTransactionAmount: Decimal;
  
  // Requirements
  requiresDocuments: boolean;
  requiresAddressProof: boolean;
  requiresSourceOfFunds: boolean;
  
  // Verification
  verificationMethod: 'MANUAL' | 'AUTOMATED' | 'BOTH';
  verificationTimeframe: number; // hours
}

const KYC_LEVELS: Record<string, KYCLevel> = {
  UNVERIFIED: {
    level: 'UNVERIFIED',
    dailyTransactionLimit: new Decimal(100),
    monthlyTransactionLimit: new Decimal(500),
    maxTransactionAmount: new Decimal(50),
    requiresDocuments: false,
    requiresAddressProof: false,
    requiresSourceOfFunds: false,
    verificationMethod: 'AUTOMATED',
    verificationTimeframe: 0
  },
  BASIC: {
    level: 'BASIC',
    dailyTransactionLimit: new Decimal(1000),
    monthlyTransactionLimit: new Decimal(5000),
    maxTransactionAmount: new Decimal(500),
    requiresDocuments: true,
    requiresAddressProof: false,
    requiresSourceOfFunds: false,
    verificationMethod: 'AUTOMATED',
    verificationTimeframe: 24
  },
  INTERMEDIATE: {
    level: 'INTERMEDIATE',
    dailyTransactionLimit: new Decimal(10000),
    monthlyTransactionLimit: new Decimal(50000),
    maxTransactionAmount: new Decimal(5000),
    requiresDocuments: true,
    requiresAddressProof: true,
    requiresSourceOfFunds: false,
    verificationMethod: 'BOTH',
    verificationTimeframe: 48
  },
  FULL: {
    level: 'FULL',
    dailyTransactionLimit: new Decimal(100000),
    monthlyTransactionLimit: new Decimal(1000000),
    maxTransactionAmount: new Decimal(50000),
    requiresDocuments: true,
    requiresAddressProof: true,
    requiresSourceOfFunds: true,
    verificationMethod: 'MANUAL',
    verificationTimeframe: 72
  }
};
```

---

## 2. AML TRANSACTION MONITORING

### Transaction Monitoring Schema

```sql
CREATE TABLE aml_transactions (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL UNIQUE,
  
  -- Transaction details
  user_id UUID NOT NULL,
  amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Risk assessment
  risk_score DECIMAL(5,2), -- 0-100
  risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  
  -- Flags
  flags JSONB, -- Array of triggered rules
  
  -- Status
  status ENUM('PENDING', 'APPROVED', 'FLAGGED', 'BLOCKED', 'REVIEWED'),
  
  -- Review
  reviewed_by UUID,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  
  CONSTRAINT aml_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_aml_transaction ON aml_transactions(transaction_id);
CREATE INDEX idx_aml_user ON aml_transactions(user_id);
CREATE INDEX idx_aml_risk ON aml_transactions(risk_level);
CREATE INDEX idx_aml_status ON aml_transactions(status);
```

---

### AML Rules Engine

```typescript
interface AMLRule {
  id: string;
  name: string;
  description: string;
  
  // Conditions
  conditions: AMLCondition[];
  
  // Action
  action: 'APPROVE' | 'FLAG' | 'BLOCK';
  riskScore: number; // 0-100
  
  // Enabled
  enabled: boolean;
}

interface AMLCondition {
  field: string; // 'amount', 'frequency', 'country', etc.
  operator: 'GT' | 'LT' | 'EQ' | 'IN' | 'CONTAINS';
  value: any;
}

const AML_RULES: AMLRule[] = [
  {
    id: 'high_amount',
    name: 'High Transaction Amount',
    description: 'Flag transactions above $10,000',
    conditions: [
      { field: 'amount', operator: 'GT', value: 10000 }
    ],
    action: 'FLAG',
    riskScore: 30,
    enabled: true
  },
  {
    id: 'rapid_succession',
    name: 'Rapid Succession Transactions',
    description: 'Flag 5+ transactions in 1 hour',
    conditions: [
      { field: 'transaction_count_1h', operator: 'GT', value: 5 }
    ],
    action: 'FLAG',
    riskScore: 40,
    enabled: true
  },
  {
    id: 'high_risk_country',
    name: 'High Risk Country',
    description: 'Block transactions to/from high-risk countries',
    conditions: [
      { field: 'country', operator: 'IN', value: ['KP', 'IR', 'SY'] }
    ],
    action: 'BLOCK',
    riskScore: 100,
    enabled: true
  },
  {
    id: 'structuring',
    name: 'Structuring Detection',
    description: 'Flag pattern of transactions just below threshold',
    conditions: [
      { field: 'structuring_score', operator: 'GT', value: 0.8 }
    ],
    action: 'FLAG',
    riskScore: 70,
    enabled: true
  }
];
```

---

### AML Scoring

```typescript
async function scoreTransaction(
  transactionId: UUID,
  userId: UUID,
  amount: Decimal,
  destination: string
): Promise<AMLScore> {
  let riskScore = 0;
  const flags: string[] = [];
  
  // 1. User risk profile
  const userProfile = await getKYCProfile(userId);
  riskScore += userProfile.risk_score * 0.3;
  
  // 2. Transaction amount
  if (amount.greaterThan(10000)) {
    riskScore += 30;
    flags.push('high_amount');
  }
  
  // 3. Velocity check
  const recentTransactions = await getRecentTransactions(userId, 1); // 1 hour
  if (recentTransactions.length > 5) {
    riskScore += 40;
    flags.push('rapid_succession');
  }
  
  // 4. Geographic risk
  const destCountry = await getCountry(destination);
  if (isHighRiskCountry(destCountry)) {
    riskScore += 100;
    flags.push('high_risk_country');
  }
  
  // 5. Structuring detection
  const structuringScore = await detectStructuring(userId);
  if (structuringScore > 0.8) {
    riskScore += 70;
    flags.push('structuring');
  }
  
  // 6. Normalize score
  riskScore = Math.min(100, riskScore);
  
  // 7. Determine level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (riskScore < 25) riskLevel = 'LOW';
  else if (riskScore < 50) riskLevel = 'MEDIUM';
  else if (riskScore < 75) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';
  
  return { riskScore, riskLevel, flags };
}
```

---

## 3. SUSPICIOUS ACTIVITY REPORTING (SAR)

### SAR Schema

```sql
CREATE TABLE suspicious_activity_reports (
  id UUID PRIMARY KEY,
  
  -- Report details
  report_type ENUM(
    'STRUCTURING',
    'UNUSUAL_ACTIVITY',
    'HIGH_RISK_TRANSACTION',
    'POTENTIAL_FRAUD',
    'SANCTIONS_MATCH',
    'OTHER'
  ) NOT NULL,
  
  -- Subject
  subject_user_id UUID NOT NULL,
  subject_transaction_id UUID,
  
  -- Description
  description TEXT NOT NULL,
  evidence JSONB, -- Array of supporting evidence
  
  -- Status
  status ENUM('PENDING', 'SUBMITTED', 'ACKNOWLEDGED', 'CLOSED'),
  
  -- Submission
  submitted_to VARCHAR(100), -- Regulatory body
  submitted_at TIMESTAMP,
  reference_number VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT sar_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_sar_user ON suspicious_activity_reports(subject_user_id);
CREATE INDEX idx_sar_type ON suspicious_activity_reports(report_type);
CREATE INDEX idx_sar_status ON suspicious_activity_reports(status);
```

---

### SAR Generation

```typescript
async function generateSAR(
  userId: UUID,
  reportType: SARType,
  description: string,
  evidence: any[]
): Promise<SuspiciousActivityReport> {
  // 1. Create SAR
  const sar = {
    id: generateUUID(),
    report_type: reportType,
    subject_user_id: userId,
    description,
    evidence,
    status: 'PENDING',
    created_at: now()
  };
  
  // 2. Store SAR
  await insertSAR(sar);
  
  // 3. Audit log
  await auditLog(userId, 'SAR_GENERATED', {
    reportType,
    description
  });
  
  // 4. Notify compliance team
  await notifyComplianceTeam({
    type: 'SAR_GENERATED',
    sarId: sar.id,
    userId,
    reportType
  });
  
  return sar;
}
```

---

## 4. SANCTIONS SCREENING

### Sanctions List Schema

```sql
CREATE TABLE sanctions_lists (
  id UUID PRIMARY KEY,
  
  -- List details
  list_name VARCHAR(255) NOT NULL,
  list_source VARCHAR(100) NOT NULL, -- 'OFAC', 'UN', 'EU', etc.
  
  -- Entries
  entries JSONB, -- Array of sanctioned entities
  
  -- Metadata
  last_updated TIMESTAMP,
  next_update TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sanctions_matches (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Match details
  match_type ENUM('EXACT', 'FUZZY', 'PARTIAL'),
  match_score DECIMAL(5,2), -- 0-100
  
  -- Matched entity
  matched_name VARCHAR(255),
  matched_list_id UUID REFERENCES sanctions_lists(id),
  
  -- Status
  status ENUM('PENDING', 'CONFIRMED', 'FALSE_POSITIVE', 'RESOLVED'),
  
  -- Review
  reviewed_by UUID,
  review_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_match_user ON sanctions_matches(user_id);
CREATE INDEX idx_match_status ON sanctions_matches(status);
```

---

### Sanctions Screening

```typescript
async function screenAgainstSanctions(
  userId: UUID,
  fullName: string,
  country: string
): Promise<SanctionsMatch[]> {
  // 1. Get sanctions lists
  const lists = await getSanctionsLists();
  
  // 2. Screen against each list
  const matches: SanctionsMatch[] = [];
  
  for (const list of lists) {
    for (const entry of list.entries) {
      // Exact match
      if (entry.name.toLowerCase() === fullName.toLowerCase()) {
        matches.push({
          id: generateUUID(),
          user_id: userId,
          match_type: 'EXACT',
          match_score: 100,
          matched_name: entry.name,
          matched_list_id: list.id,
          status: 'PENDING',
          created_at: now()
        });
      }
      
      // Fuzzy match
      const similarity = calculateSimilarity(fullName, entry.name);
      if (similarity > 0.85) {
        matches.push({
          id: generateUUID(),
          user_id: userId,
          match_type: 'FUZZY',
          match_score: similarity * 100,
          matched_name: entry.name,
          matched_list_id: list.id,
          status: 'PENDING',
          created_at: now()
        });
      }
    }
  }
  
  // 3. Store matches
  if (matches.length > 0) {
    await insertSanctionsMatches(matches);
    
    // 4. Block user if exact match
    const exactMatches = matches.filter(m => m.match_type === 'EXACT');
    if (exactMatches.length > 0) {
      await blockUser(userId, 'SANCTIONS_MATCH');
      await generateSAR(userId, 'SANCTIONS_MATCH', 'Exact sanctions match', matches);
    }
  }
  
  return matches;
}
```

---

## 5. COMPLIANCE MONITORING

### Compliance Dashboard Schema

```sql
CREATE TABLE compliance_metrics (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  
  -- KYC metrics
  total_users INT,
  verified_users INT,
  pending_verification INT,
  
  -- AML metrics
  total_transactions INT,
  flagged_transactions INT,
  blocked_transactions INT,
  
  -- SAR metrics
  total_sars INT,
  submitted_sars INT,
  
  -- Sanctions
  total_matches INT,
  confirmed_matches INT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metrics_date ON compliance_metrics(date);
```

---

### Compliance Reporting

```typescript
interface ComplianceReport {
  period: DateRange;
  
  // KYC
  kycMetrics: {
    totalUsers: number;
    verifiedUsers: number;
    verificationRate: number;
    averageVerificationTime: number;
  };
  
  // AML
  amlMetrics: {
    totalTransactions: number;
    flaggedTransactions: number;
    blockedTransactions: number;
    flagRate: number;
  };
  
  // SAR
  sarMetrics: {
    totalSARs: number;
    submittedSARs: number;
    averageTimeToSubmit: number;
  };
  
  // Sanctions
  sanctionsMetrics: {
    totalMatches: number;
    confirmedMatches: number;
    falsePositiveRate: number;
  };
}

async function generateComplianceReport(
  startDate: Date,
  endDate: Date
): Promise<ComplianceReport> {
  return {
    period: { startDate, endDate },
    kycMetrics: await getKYCMetrics(startDate, endDate),
    amlMetrics: await getAMLMetrics(startDate, endDate),
    sarMetrics: await getSARMetrics(startDate, endDate),
    sanctionsMetrics: await getSanctionsMetrics(startDate, endDate)
  };
}
```

---

## 6. NON-NEGOTIABLES

### KYC Cannot Be Bypassed

**FORBIDDEN:**
```typescript
// ❌ WRONG - Transaction without KYC check
async function executeTransaction(userId: UUID, amount: Decimal) {
  // No KYC verification
  await processTransaction(userId, amount);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - KYC check before transaction
async function executeTransaction(userId: UUID, amount: Decimal) {
  // 1. Get KYC profile
  const kyc = await getKYCProfile(userId);
  
  // 2. Verify KYC status
  if (kyc.kyc_status !== 'APPROVED') {
    throw new Error('KYC not approved');
  }
  
  // 3. Check limits
  const limits = KYC_LEVELS[kyc.kyc_level];
  if (amount.greaterThan(limits.maxTransactionAmount)) {
    throw new Error('Amount exceeds limit');
  }
  
  // 4. Process transaction
  await processTransaction(userId, amount);
}
```

---

### AML Scoring Must Happen

**FORBIDDEN:**
```typescript
// ❌ WRONG - No AML scoring
async function processTransaction(userId: UUID, amount: Decimal) {
  // No AML check
  await executeTransaction(userId, amount);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - AML scoring before execution
async function processTransaction(
  userId: UUID,
  amount: Decimal,
  destination: string
): Promise<void> {
  // 1. Score transaction
  const amlScore = await scoreTransaction(
    generateUUID(),
    userId,
    amount,
    destination
  );
  
  // 2. Check risk level
  if (amlScore.riskLevel === 'CRITICAL') {
    // Block and report
    await blockTransaction(userId);
    await generateSAR(userId, 'HIGH_RISK_TRANSACTION', 'Critical risk score', [amlScore]);
    throw new Error('Transaction blocked');
  }
  
  if (amlScore.riskLevel === 'HIGH') {
    // Flag for review
    await flagTransaction(userId, amlScore);
  }
  
  // 3. Execute transaction
  await executeTransaction(userId, amount);
}
```

---

### Sanctions Screening Required

**FORBIDDEN:**
```typescript
// ❌ WRONG - No sanctions screening
async function onboardUser(userId: UUID, fullName: string, country: string) {
  // No sanctions check
  await createUser(userId, fullName, country);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Sanctions screening before onboarding
async function onboardUser(
  userId: UUID,
  fullName: string,
  country: string
): Promise<void> {
  // 1. Screen against sanctions
  const matches = await screenAgainstSanctions(userId, fullName, country);
  
  // 2. Check for exact matches
  const exactMatches = matches.filter(m => m.match_type === 'EXACT');
  if (exactMatches.length > 0) {
    throw new Error('User matches sanctions list');
  }
  
  // 3. Create user
  await createUser(userId, fullName, country);
}
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: KYC Foundation (Weeks 1-2)
- [ ] Create KYC schema
- [ ] Implement KYC levels
- [ ] Add document verification
- [ ] Create KYC workflow

### Phase 2: AML Monitoring (Weeks 3-4)
- [ ] Implement AML rules engine
- [ ] Add transaction scoring
- [ ] Create AML monitoring
- [ ] Add flagging workflow

### Phase 3: SAR & Sanctions (Weeks 5-6)
- [ ] Implement SAR generation
- [ ] Add sanctions screening
- [ ] Create sanctions matching
- [ ] Add SAR submission

### Phase 4: Reporting (Weeks 7-8)
- [ ] Implement compliance metrics
- [ ] Create compliance reports
- [ ] Add regulatory reporting
- [ ] Add monitoring dashboards

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** Architecture Design (Ready for Implementation)
