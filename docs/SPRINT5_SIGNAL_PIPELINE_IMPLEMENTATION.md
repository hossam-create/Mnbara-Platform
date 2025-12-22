# Sprint 5: Voice / Camera / Signals (Advisory-Only)

## Status: COMPLETE

## Overview

Advisory-only signal processing pipeline for voice and camera inputs. Ephemeral processing with no media persistence.

## Hard Rules Enforced

| Rule | Implementation |
|------|----------------|
| Feature flags OFF by default | `FF_SIGNAL_ADVISORY_ENABLED=false` |
| Explicit session-level consent required | Consent validation on session creation |
| Ephemeral processing only | In-memory only, no DB writes |
| No raw audio/video persistence | Transcript/features only, no media |
| No cross-session memory | Sessions isolated, auto-expire |
| No ML training from signals | Deterministic rules only |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE CAPTURE                       │
│  ┌─────────────┐    ┌─────────────┐                         │
│  │   Voice     │    │   Camera    │                         │
│  │  (Browser)  │    │  (Browser)  │                         │
│  └──────┬──────┘    └──────┬──────┘                         │
│         │                  │                                 │
│         ▼                  ▼                                 │
│  ┌─────────────┐    ┌─────────────┐                         │
│  │ Transcript  │    │  Feature    │  ← Client extracts      │
│  │  Extract    │    │  Extract    │    (no raw media sent)  │
│  └──────┬──────┘    └──────┬──────┘                         │
└─────────┼──────────────────┼────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  ADVISORY SERVICE (Server)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Session Manager                         │    │
│  │  • Consent validation                               │    │
│  │  • TTL enforcement (15 min)                         │    │
│  │  • Rate limiting                                    │    │
│  │  • Opt-out enforcement                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Deterministic Processor                    │    │
│  │  • Rule-based intent clarification                  │    │
│  │  • Keyword-based suggestions                        │    │
│  │  • NO ML inference                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TEXT-ONLY OUTPUT                        │    │
│  │  • Intent clarification                             │    │
│  │  • Item description summary                         │    │
│  │  • Risk education hints                             │    │
│  │  • Next-step suggestions                            │    │
│  │  • Human confirmation required                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              IMMEDIATE DISCARD                       │    │
│  │  • No media storage                                 │    │
│  │  • Audit log: metadata only                         │    │
│  │  • Input hash for dedup (not content)               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Supported Outputs

| Output Type | Description | Human Confirmation |
|-------------|-------------|-------------------|
| `INTENT_CLARIFICATION` | Clarify user intent from voice | Required |
| `ITEM_DESCRIPTION` | Generate item description from camera | Required |
| `RISK_EDUCATION` | Educational hints about risks | Advisory only |
| `NEXT_STEP_SUGGESTION` | Suggest next action | Required |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/advisory/constraints` | GET | Hard constraints (always available) |
| `/api/advisory/session` | POST | Create session with consent |
| `/api/advisory/session/status` | GET | Get session status |
| `/api/advisory/session/opt-out` | POST | Opt out of session |
| `/api/advisory/voice` | POST | Process voice transcript |
| `/api/advisory/camera` | POST | Process camera features |
| `/api/advisory/health` | GET | Health status |
| `/api/advisory/audit` | GET | Audit log (metadata only) |

## Safeguards

### 1. Session TTL
- Auto-expire after 15 minutes
- No session extension
- Immediate cleanup on expiry

### 2. Kill Switches
- Per-signal type: `VOICE`, `CAMERA`
- Global: `GLOBAL`
- Immediate effect

### 3. Rate Limits
| Limit | Value |
|-------|-------|
| Voice requests/minute | 10 |
| Camera requests/minute | 5 |
| Sessions/hour | 10 |
| Max session duration | 15 min |

### 4. Opt-Out Enforcement
- Full opt-out at any time
- Prevents all further processing
- Session marked as `OPTED_OUT`

## Feature Flags

```env
# Signal Advisory (Sprint 5)
FF_SIGNAL_ADVISORY_ENABLED=false
FF_VOICE_ADVISORY_ENABLED=false
FF_CAMERA_ADVISORY_ENABLED=false
```

## Audit Logging

Audit entries contain metadata only:

```typescript
interface SignalAuditEntry {
  id: string;
  sessionId: string;
  userId: string;
  signalType: 'VOICE' | 'CAMERA';
  outputType: AdvisoryOutputType;
  consentTimestamp: string;
  processedAt: string;
  inputHash?: string;  // Hash only, not content
  success: boolean;
  errorCode?: string;
  // NO content stored
}
```

## Files Created

| File | Purpose |
|------|---------|
| `types/signal-advisory.types.ts` | Type definitions |
| `services/signal-advisory.service.ts` | Core service logic |
| `routes/signal-advisory.routes.ts` | API routes |
| `__tests__/signal-advisory.test.ts` | Test coverage |

## Test Coverage

- ✅ Consent enforcement
- ✅ Kill-switch behavior
- ✅ No persistence guarantees
- ✅ Deterministic outputs per input
- ✅ Session TTL enforcement
- ✅ Rate limiting
- ✅ Opt-out enforcement
- ✅ Disclaimer presence
- ✅ Human confirmation flags

## DO NOT

| Blocked Action | Reason |
|----------------|--------|
| Store media | Privacy, compliance |
| Identify people | No face detection/recognition |
| Modify trust/risk | Advisory only |
| Trigger transactions | Human confirmation required |
| Cross-session memory | Privacy, isolation |
| ML training | No model updates from signals |

## Constraints Summary

```
┌─────────────────────────────────────────────────────────┐
│              SIGNAL ADVISORY CONSTRAINTS                 │
├─────────────────────────────────────────────────────────┤
│ ✅ Voice transcript processing                           │
│ ✅ Camera feature extraction                             │
│ ✅ Intent clarification                                  │
│ ✅ Item description suggestions                          │
│ ✅ Risk education hints                                  │
│ ✅ Next-step suggestions                                 │
├─────────────────────────────────────────────────────────┤
│ ❌ Raw audio storage                                     │
│ ❌ Raw image storage                                     │
│ ❌ Face detection/recognition                            │
│ ❌ Cross-session memory                                  │
│ ❌ ML model training                                     │
│ ❌ Trust/risk modification                               │
│ ❌ Transaction triggering                                │
├─────────────────────────────────────────────────────────┤
│ Session TTL: 15 minutes                                  │
│ Voice rate: 10 req/min                                   │
│ Camera rate: 5 req/min                                   │
│ Sessions/hour: 10                                        │
└─────────────────────────────────────────────────────────┘
```

## Integration Example

```typescript
import { signalAdvisoryService } from './services/signal-advisory.service';

// 1. Create session with consent
const session = signalAdvisoryService.createSession(
  'user123',
  'VOICE',
  {
    userId: 'user123',
    signalType: 'VOICE',
    consentGiven: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: '1.0.0',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }
);

// 2. Process voice transcript (no raw audio)
const result = signalAdvisoryService.processVoiceAdvisory({
  sessionId: session.session.sessionId,
  transcript: 'I want to buy a phone',
  language: 'en',
  context: { market: 'MARKET_0' },
});

// 3. Result requires human confirmation
console.log(result.advisory.clarifiedIntent?.requiresHumanConfirmation); // true
```
