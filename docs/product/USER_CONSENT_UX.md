# USER CONSENT UX SPECIFICATION
## Signal Permission & Privacy Patterns

**Confidential**
**Classification:** UX / Privacy
**Audience:** Design, Frontend, Legal Teams
**Date:** December 19, 2025

---

## 1. Consent Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     "ASK CLEARLY. EXPLAIN FULLY. RESPECT 'NO'."            │
│                                                             │
│  Consent is a right, not an obstacle.                       │
│  Make saying no as easy as saying yes.                      │
│  Never punish users for declining.                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

| Principle | Implementation |
| :--- | :--- |
| **Informed** | User knows what they're agreeing to |
| **Specific** | Each permission is separate |
| **Freely given** | No dark patterns, equal options |
| **Revocable** | Easy to change mind later |
| **Honest** | We do what we say, nothing more |

---

## 2. Permission Request Flows

### 2.1 Microphone Permission

**Trigger:** User taps microphone button for first time

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User taps 🎤                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────┐                                   │
│  │ Has granted before? │                                   │
│  └─────────────────────┘                                   │
│       │           │                                         │
│      Yes         No                                         │
│       │           │                                         │
│       ▼           ▼                                         │
│  Start recording  Show Consent Modal                       │
│                        │                                    │
│              ┌─────────┴─────────┐                         │
│              │                   │                          │
│          "Allow"            "Not now"                       │
│              │                   │                          │
│              ▼                   ▼                          │
│      Start recording      Close modal                       │
│                          (No negative                        │
│                           consequence)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Camera Permission

**Trigger:** User taps camera button for first time

**Flow:** Same as microphone, with camera-specific copy

---

### 2.3 Combined Permission (If Needed)

**Trigger:** Feature requires both mic and camera

**Rule:** Ask separately, never bundle

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  If feature needs both:                                     │
│                                                             │
│  1. Ask for first permission (e.g., camera)                │
│  2. If granted, proceed                                     │
│  3. When mic needed, ask for mic                            │
│                                                             │
│  Never: "Allow camera AND microphone"                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Consent Modal Specifications

### 3.1 Modal Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [Icon]  TITLE                                      │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  DESCRIPTION                                        │   │
│  │  What we're asking for and why                      │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  ✓ WHAT WE DO                                       │   │
│  │  • Point 1                                          │   │
│  │  • Point 2                                          │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  ✗ WHAT WE DON'T DO                                 │   │
│  │  • Point 1                                          │   │
│  │  • Point 2                                          │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  [ Decline ]              [ Allow ]                 │   │
│  │                                                     │   │
│  │  (Equal size, equal prominence)                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Button Specifications

| Element | Requirement |
| :--- | :--- |
| **Size** | Both buttons same size |
| **Color** | Equal visual weight (not green vs gray) |
| **Position** | Decline on left, Allow on right |
| **Labels** | "Not now" (not "No" or "Cancel") |
| **Tap target** | Minimum 44x44px both buttons |

### 3.3 Copy Requirements

| Section | Max Length | Requirement |
| :--- | :--- | :--- |
| Title | 5 words | Clear statement of permission |
| Description | 25 words | What and why |
| What we do | 4 bullet points | Specific, honest |
| What we don't do | 3 bullet points | Address fears |

---

## 4. Decline Handling

### 4.1 Immediate Response

**When User Taps "Not now":**
```
┌─────────────────────────────────────────────────────────────┐
│  Modal closes immediately                                   │
│  No guilt message                                           │
│  No "Are you sure?"                                         │
│  No tracking of decline                                     │
│  Feature gracefully degrades to alternative                 │
└─────────────────────────────────────────────────────────────┘
```

**Alternative Shown:**
```
🎤 Voice input is unavailable

You can type your request instead:

[ Type your request... ]

To use voice, allow microphone access in Settings.
[ Open Settings ]
```

### 4.2 Re-Request Timing

| Scenario | When to ask again |
| :--- | :--- |
| User declined once | Never automatically |
| User taps mic button again | Show settings reminder |
| New app version | Never automatically |
| After 30 days | Never automatically |

**Re-Request Only If User Initiates:**
```
User taps 🎤 button after declining
       │
       ▼
┌───────────────────────────────────────┐
│ Microphone access is off              │
│                                       │
│ To use voice input, you'll need to   │
│ allow microphone in your settings.    │
│                                       │
│ [ Cancel ]  [ Open Settings ]         │
└───────────────────────────────────────┘
```

---

## 5. Recording Indicators

### 5.1 Active Recording State

**Visual Requirements:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  MUST HAVE:                                                 │
│  • Red dot (🔴) or pulsing indicator                       │
│  • Text: "Recording..." or "Listening..."                  │
│  • Prominent Stop button                                    │
│  • Cannot be dismissed without stopping                     │
│                                                             │
│  POSITION:                                                  │
│  • Top of recording interface                               │
│  • Visible at all times during recording                    │
│  • Status bar indicator if platform supports                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Example:**
```
┌─────────────────────────────────────────────────────────────┐
│  🔴 Recording...                               [ ⬛ Stop ] │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Camera Active State

**Visual Requirements:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  MUST HAVE:                                                 │
│  • Live viewfinder showing what camera sees                │
│  • Shutter button clearly labeled                          │
│  • Cancel/Close option                                      │
│  • No hidden capture                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Post-Capture Review

### 6.1 Mandatory Review

**Before Using Captured Data:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  USER MUST SEE:                                             │
│  • What was captured (transcript/photo)                    │
│  • What we interpreted from it                              │
│  • Options to: Edit, Delete, Accept                        │
│                                                             │
│  NEVER:                                                     │
│  • Auto-submit captured data                                │
│  • Hide what was captured                                   │
│  • Make delete hard to find                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Review Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  What you said:                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ "I'm looking for a black iPhone 15 Pro Max..."       │ │
│  │                                                       │ │
│  │ [ 🔊 Play ]  [ ✏️ Edit ]  [ 🗑️ Delete ]              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  We understood:                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ • iPhone 15 Pro Max                                   │ │
│  │ • Black                                               │ │
│  │ • 256GB                                               │ │
│  │                                                       │ │
│  │ Does this look right?                                 │ │
│  │                                                       │ │
│  │ [ No, edit ]          [ Yes, continue ]               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Delete Functionality

**Delete Location:** Visible on review screen

**Delete Behavior:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  When user taps Delete:                                     │
│                                                             │
│  1. Immediate deletion (no "Are you sure?")                 │
│  2. Show: "Recording deleted"                               │
│  3. Return to input options                                 │
│                                                             │
│  Data Status After Delete:                                  │
│  • Audio/photo: Permanently deleted                         │
│  • Transcript: Deleted                                      │
│  • Parsed data: Deleted                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Settings & Revocation

### 7.1 In-App Settings

**Location:** Settings → Privacy → Permissions

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  PRIVACY                                                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🎤 Microphone                                         │ │
│  │                                                       │ │
│  │ Used for: Voice input to describe items              │ │
│  │ Status: Allowed                                       │ │
│  │                                                       │ │
│  │ [ Manage in device settings ]                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📷 Camera                                             │ │
│  │                                                       │ │
│  │ Used for: Photo input to describe items              │ │
│  │ Status: Not allowed                                   │ │
│  │                                                       │ │
│  │ [ Manage in device settings ]                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ℹ️ Permissions are managed by your device.                │
│     Tap "Manage" to change them.                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Revocation Response

**When Permission Revoked:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  If user revokes permission in device settings:             │
│                                                             │
│  1. Feature gracefully disables                             │
│  2. No error message unless user tries to use               │
│  3. Alternative always available (typing)                   │
│  4. No "nag" to re-enable                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Anti-Pattern Checklist

Before shipping any consent flow:

### Modal Design
- [ ] Both buttons are equal size
- [ ] No color manipulation (green Allow, gray Decline)
- [ ] No "Not now" vs "Never" trick
- [ ] No checkbox pre-selected
- [ ] No required scroll to see Decline

### Copy
- [ ] No guilt language ("You'll miss out")
- [ ] No fear language ("Required for your safety")
- [ ] No vague permission ("Improve your experience")
- [ ] Clear statement of what is captured

### Flow
- [ ] Can decline without explanation
- [ ] Decline doesn't break app flow
- [ ] Re-ask only when user initiates
- [ ] Settings accessible to revoke

### Recording
- [ ] Recording indicator always visible
- [ ] Stop button always accessible
- [ ] Review before use
- [ ] Delete always available

---

## 9. Platform-Specific Notes

### iOS

| Behavior | Implementation |
| :--- | :--- |
| Recording indicator | System shows orange dot; we add in-app indicator too |
| Camera indicator | System shows green dot; we add in-app indicator too |
| Permission prompt | System shows first; we show our context first |

### Android

| Behavior | Implementation |
| :--- | :--- |
| Recording indicator | Varies by device; always add in-app indicator |
| One-time permission | Supported on Android 11+; respect it |
| Background detection | System may block; handle gracefully |

### Web

| Behavior | Implementation |
| :--- | :--- |
| Browser prompt | Browser shows native prompt; we explain before |
| HTTPS required | Mic/camera require HTTPS |
| Persistent permission | Per-domain; remember state |

---

## 10. Compliance Summary

| Requirement | Implementation |
| :--- | :--- |
| GDPR Art. 7 (Consent) | Freely given, specific, informed, unambiguous |
| GDPR Art. 17 (Erasure) | Delete functionality available |
| CCPA | No sale of captured data |
| Platform Guidelines | Visible indicators, user control |
| Accessibility | All controls labeled, screen reader compatible |

---
**Document Owner:** Privacy Lead
**Legal Review:** DPO, Legal
**Version:** 1.0 (User Consent UX)
