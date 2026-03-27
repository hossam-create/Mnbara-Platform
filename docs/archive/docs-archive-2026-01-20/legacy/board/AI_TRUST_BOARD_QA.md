# Board & Risk Committee Q&A: AI Trust & Risk Operating System

**Document ID:** BOARD-RISK-QA-001
**Audience:** Board of Directors, Risk Committee, Audit Committee
**Context:** Approval for Production Launch of AI Risk System

---

## SECTION 1 — EXECUTIVE RISK

### Q1. Board: "Can this system create a headline risk by wrongfully accusing customers of fraud?"
**Answer:** "The system is designed with a 'recommendation only' safeguard. It filters traffic but does not autonomously execute high-impact bans without human confirmation. A human officer is the final gatekeeper for sensitive actions."
**Risk Mitigation:** By keeping a human in the loop for negative actions, we remove the risk of 'runaway AI' damaging our reputation autonomously.

### Q2. Board: "If the AI makes a mistake, who is liable—us or the vendor?"
**Answer:** "We are. The system is a tool we configure, like a spreadsheet. We own the policy rules it executes. The algorithm itself is not a legal entity, so accountability remains with our Chief Risk Officer."
**Risk Mitigation:** Clarifying liability ensures we maintain robust internal controls and don't rely on false 'vendor indemnification' hopes.

### Q3. Board: "Could this bias against certain customer demographics and invite a lawsuit?"
**Answer:** "We have architecturally walled off protected data. The system cannot 'see' race, gender, or religion. It only evaluates transaction behaviors (spend velocity, device location) which are legally defensible risk indicators."
**Risk Mitigation:** 'Privacy by Design' minimizes disparate impact litigation risk.

### Q4. Board: "What is the worst-case financial scenario if the system fails?"
**Answer:** "The system has a 'Circuit Breaker'. If it fails, operations degrade to a manual review queue or a strict limit mode. It cannot autonomously authorize unlimited transfers or empty the bank."
**Risk Mitigation:** Hard-coded limits on transaction value prevent catastrophic financial loss.

### Q5. Board: "How do we know the AI isn't hallucinating facts?"
**Answer:** "This is not Generative AI (like ChatGPT). It is a Deterministic Expert System. It does not create new content or 'guess'; it strictly calculates mathematical rules we defined. It cannot hallucinate."
**Risk Mitigation:** Using deterministic logic eliminates the unpredictability of generative models.

### Q6. Board: "Will regulators view this as 'Automated Decision Making' under GDPR?"
**Answer:** "Our legal counsel advises No, because the system provides a 'recommendation' to a human, who makes the final legal decision. This keeps us compliant with Article 22."
**Risk Mitigation:** Avoiding the 'Automated Decision' classification reduces regulatory burden significantly.

### Q7. Board: "Are we training this AI on customer data?"
**Answer:** "No. We do not use customer data to train 'black box' models. We use data only to verify individual transactions against static rules."
**Risk Mitigation:** Eliminates data privacy risks associated with model inversion or data leakage.

### Q8. Board: "Can a cyber-attack on this system compromise our ledger?"
**Answer:** "The system has 'Read-Only' access to the ledger. Even if fully compromised, it cannot write transactions or move money. It can only issue risk alerts."
**Risk Mitigation:** Unidirectional data flow prevents the risk engine from becoming an attack vector for theft.

---

## SECTION 2 — AI CONTROL & LIMITS

### Q9. Board: "What is the AI explicitly forbidden to do?"
**Answer:** "It cannot move money, permanently ban users, change its own code, or deploy new rules without authorization."
**Risk Mitigation:** Defining negative constraints creates a safety perimeter around the AI.

### Q10. Board: "Can a human override the AI if they disagree?"
**Answer:** "Always. Human authority is absolute. If a Risk Officer says 'Approve', the system must comply, though it will log the event for audit."
**Risk Mitigation:** Ensures human context can correct machine rigidity.

### Q11. Board: "Does the AI learn from its mistakes automatically?"
**Answer:** "No. We have disabled 'Online Learning'. The system does not change itself. Humans must analyze errors and manually update the rules."
**Risk Mitigation:** Prevents the system from learning bad habits or bias from corrupted data.

### Q12. Board: "How do we stop a 'bad rule' once it's live?"
**Answer:** "We have an 'Emergency Rollback' button that reverts the system to the previous safe stricture instantly. Authority to use this sits with the Duty Officer."
**Risk Mitigation:** Provides an immediate abort mechanism for operational safety.

### Q13. Board: "Can the AI escalate a conflict without telling anyone?"
**Answer:** "No. All high-risk escalations trigger a mandatory alert to the human queue. It cannot silently bury a risk."
**Risk Mitigation:** Guarantees visibility on critical incidents.

### Q14. Board: "How do we verify the AI is doing what we told it?"
**Answer:** "We use 'Shadow Evaluation'. We run every new rule in the background first to prove it works correctly before letting it touch live decisions."
**Risk Mitigation:** Testing in production without impact reduces release risk.

### Q15. Board: "Is the logic auditable?"
**Answer:** "Yes. Every decision is logged with a 'Trace' showing exactly which rule triggered. It is not a black box; it is a glass box."
**Risk Mitigation:** Full transparency satisfies auditor requirements.

### Q16. Board: "Does it have a 'fail-safe' mode?"
**Answer:** "Yes. If data is missing, it defaults to 'Refer for Review' rather than guessing. It favors caution over speed."
**Risk Mitigation:** Prevents automated approval of unknown risks.

---

## SECTION 3 — OPERATIONAL RELIABILITY

### Q17. Board: "What happens if the system goes down?"
**Answer:** "Business continuity plans activate. Transactions route to a manual fallback queue. We process slower, but we don't stop."
**Risk Mitigation:** Ensures operational resilience.

### Q18. Board: "Can it handle Black Friday volumes?"
**Answer:** "The architecture is stateless and horizontally scalable. We can add capacity in minutes to handle spikes."
**Risk Mitigation:** Scalability protects revenue during peak events.

### Q19. Board: "How do we know if the model is 'drifting'?"
**Answer:** "We monitor the 'Approval Rate' daily. If it swings wildly (e.g., from 90% to 50%), alarms sound immediately."
**Risk Mitigation:** Statistical monitoring catches silent failures early.

### Q20. Board: "Who watches the watcher?"
**Answer:** "An independent Internal Audit team reviews the system's decisions quarterly to ensure it aligns with policy."
**Risk Mitigation:** The 'Three Lines of Defense' model applies here.

### Q21. Board: "Are we dependent on one vendor?"
**Answer:** "The logic is owned by us. If the software provider disappears, we still own the rules and can migrate them to another engine."
**Risk Mitigation:** Reduces vendor lock-in risk.

### Q22. Board: "How fast can we fix a bug?"
**Answer:** "We have a 'Hotfix' path that allows a tested correction to be deployed in under 2 hours with full audit trail."
**Risk Mitigation:** Agility minimizes the window of exposure.

### Q23. Board: "Is the data secure?"
**Answer:** "Data is processed in memory and encrypted at rest. We do not store sensitive PII long-term in the risk engine."
**Risk Mitigation:** Minimizes the target surface for data breaches.

---

## SECTION 4 — GOVERNANCE & ACCOUNTABILITY

### Q24. Board: "Who owns the 'Kill Switch'?"
**Answer:** "The Head of Risk Operations. They have 24/7 authority to degrade the system if it misbehaves."
**Risk Mitigation:** Clear chain of command for crisis management.

### Q25. Board: "Who signs off on new risk rules?"
**Answer:** "A committee of Risk, Compliance, and Legal. No single developer can push a rule to production."
**Risk Mitigation:** Prevents 'Shadow IT' and unauthorized changes.

### Q26. Board: "How do we prevent fraud by our own staff?"
**Answer:** "Immutable Audit Logs. Every override is recorded forever. We can detect if an employee systematically approves their friends."
**Risk Mitigation:** Internal fraud controls are built-in.

### Q27. Board: "Do we have insurance for this?"
**Answer:** "Our Cyber & E&O policies cover operational errors. By using a 'Human-in-the-Loop' model, we remain within standard coverage terms."
**Risk Mitigation:** Financial risk transfer.

### Q28. Board: "Does this replace our Compliance team?"
**Answer:** "No. It makes them more efficient. It removes the 'noise' so they can focus on complex investigations. It is a force multiplier, not a replacement."
**Risk Mitigation:** Maintains essential human expertise in the organization.

### Q29. Board: "Are the logs tamper-proof?"
**Answer:** "Yes. They are written to 'Write-Once' storage. Even IT admins cannot delete history."
**Risk Mitigation:** Ensures evidence integrity for investigations.

### Q30. Board: "Can we prove to a judge why we blocked someone?"
**Answer:** "Yes. The system generates a 'Statement of Reasons' for every block. We can present the exact logic used in court."
**Risk Mitigation:** Defensibility in litigation.

---

## SECTION 5 — STRATEGIC VALUE & DEFENSIBILITY

### Q31. Board: "Why is this safer than manual review?"
**Answer:** "Humans get tired, biased, and make typos. This system applies our best policy consistently, 24/7, without fatigue."
**Risk Mitigation:** Consistency reduces operational error rates.

### Q32. Board: "Why is this safer than 'Black Box' AI?"
**Answer:** "Black Box AI is unpredictable. This system is mathematically certain. We trade some theoretical power for absolute control and safety."
**Risk Mitigation:** Prioritizing safety over raw optimization aligns with our risk appetite.

### Q33. Board: "Does this give us a competitive advantage?"
**Answer:** "Yes. We can onboard good customers instantly while competitors make them wait days for manual checks. Safety *is* speed."
**Risk Mitigation:** Growth enabled by robust controls.

### Q34. Board: "Is this sustainable long-term?"
**Answer:** "Yes. The modular design allows us to update rules as regulations change, without rebuilding the whole system."
**Risk Mitigation:** Future-proofing against regulatory shifts.

### Q35. Board: "What is the final verdict on safety?"
**Answer:** "By strictly limiting the AI to 'Advisory' status and enforcing 'Human-in-the-Loop', we have capped the downside risk while capturing the upside efficiency."
**Risk Mitigation:** Balanced risk/reward profile.
