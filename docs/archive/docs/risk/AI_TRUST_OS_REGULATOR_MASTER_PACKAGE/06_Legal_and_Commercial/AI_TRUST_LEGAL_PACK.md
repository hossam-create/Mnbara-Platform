# Legal, Data Privacy & Retention Pack: AI Trust & Risk Platform

**Document ID:** LEGAL-AI-TRUST-001
**Classification:** Confidential / Legal Counsel Only
**Version:** 1.0
**Status:** DRAFT FOR COUNSEL REVIEW

---

## 1. Data Categories & Inventory

The System strictly categorizes data into **Input Signals** and **Decision Outputs**. The System does **not** act as a System of Record (SoR) for user identity but rather as a System of Intelligence (SoI) that processes transient data.

### 1.1 Authorized Data Categories (Input)
*   **Transaction Metadata:** Amount, Currency, Timestamp, Merchant Category Code (MCC).
*   **Device Telemetry:** IP Address, Device Fingerprint Hash, User-Agent String, Geolocation (City/Country level only).
*   **Behavioral Aggregate:** Velocity counts (e.g., "Number of transactions in last hour"), Session duration.
*   **Status Flags:** KYC Verification Status (`Verified`/`Pending`), PEP (Politically Exposed Person) Status (`True`/`False`).

### 1.2 Explicitly Excluded Data (Forbidden)
To minimize liability and privacy risk, the System is architecturally barred from ingesting:
*   **Biometric Templates:** No FaceID, Fingerprint, or Voice data. (The System only accepts a boolean `Authentication_Success` flag from the separate Auth Provider).
*   **Special Category Data:** No data revealing race, ethnic origin, political opinions, religious beliefs, or trade union membership (GDPR Art. 9).
*   **Unstructured PII:** No raw chat logs, email bodies, or support ticket text, to prevent accidental ingestion of sensitive details.

---

## 2. Data Minimization Principles

The System adheres to **Privacy by Design**:
1.  **Pseudonymization:** Wherever possible, User IDs are hashed before entry into the Risk Engine. The Engine assesses the *pattern*, not the *person*.
2.  **Ephemeral Processing:** High-sensitivity signals (e.g., exact geolocation coordinates) are processed in volatile memory to derive a lower-resolution signal (e.g., "Distance from Home > 50km") and then immediately discarded. They are not committed to disk.
3.  **Scoped Access:** The System retrieves only the specific fields required for the active Rule Set (e.g., if the rule checks `Amount`, we do not fetch `Merchant Name`).

---

## 3. Data Retention Policy

Retention periods are defined based on the "Legal Basis" for processing (Legitimate Interest / Legal Obligation).

| Data Type | Retention Period | Rationale |
| :--- | :--- | :--- |
| **Transaction Inputs** | 90 Days | Operational windows for dispute resolution and fraud pattern analysis. |
| **Decision Logs (Audit)** | 7 Years | Compliance with anti-money laundering (AML) and financial audit regulations. |
| **Ephemeral Cache** | 24 Hours | Performance caching only; cleared daily. |
| **Rejected Events** | 5 Years | Evidence defense against potential discrimination claims. |

---

## 4. Deletion & Right-to-Erasure (GDPR Art. 17)

### 4.1 "Right to be Forgotten" Handling
Upon receipt of a valid Erasure Request:
1.  **Input Data:** Permanently purged from the Input Stores.
2.  **Decision Logs (Audit):** **Retained.**
    *   *Legal Exception:* Under GDPR Art. 17(3)(b) and (e), the right to erasure does **not** apply to data required for compliance with a legal obligation (AML laws) or for the establishment, exercise, or defence of legal claims.
    *   *Mechanism:* Audit logs are cryptographically sealed; they cannot be edited. They serve as an immutable record that a decision was made at a point in time.

---

## 5. GDPR & Regulatory Alignment

### 5.1 Automated Decision Making (Art. 22)
The System is configured to be **"Human-in-the-Loop" (HITL)** by default.
*   **Constraint:** The System does **not** produce legal effects (e.g., contract termination) solely based on automated processing.
*   **Safeguard:** All adverse decisions (High Risk / Block) are classified as "Recommendations" pending human review or are subject to an immediate, accessible appeal process.

### 5.2 Model Training on Personal Data
*   **Statement:** The System operates as a **Static Expert System**. It does **not** use Customer PII to train machine learning models in production. There is no risk of "Model Inversion Attacks" leaking user data because there is no ML model trained on user data.

---

## 6. Liability Boundaries

To clarify legal exposure in the event of error:

1.  **System Liability (The Tool):** Limited to technical malfunctions (e.g., "The system failed to execute Rule #123 as written").
2.  **Operator Liability (The Company):** The Company assumes full liability for the **Policies** (Rule Sets) configured in the system. If a rule is discriminatory, it is a policy failure, not a software failure.
3.  **Human Liability (The Reviewer):** The human agent assumes liability for **Override Decisions**. If the System flags "High Risk" and the human overrides to "Approve" without cause, the liability rests with the human agent's negligence.

---

## 7. Legal Explainability

All decisions produced by the System are **legally explainable**.
*   **Determinism:** We can prove mathematically that `Input X` + `Policy Y` = `Output Z`.
*   **No "Black Box":** We do not use neural networks or deep learning for decisioning. We use decision trees and logic gates.
*   **Defense:** In court, we produce the exact JSON Logic rule used at the time of the transaction, proving that the decision was applied consistently and without bias, strictly adhering to the pre-defined risk policy.

---

**Legal Review Sign-off:**
General Counsel / Data Protection Officer (DPO)
Date: 2025-12-17
