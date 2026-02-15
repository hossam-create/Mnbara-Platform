# Launch Options Comparison - Build vs Buy

**Date**: January 31, 2026  
**Purpose**: Compare two launch strategies side-by-side

---

## OPTION A: BUILD CUSTOM (Original Plan)

### Timeline: 9-12 months

```
Month 1-2:   Legal foundation + License applications
Month 3-6:   License processing (waiting...)
Month 7-9:   Build custom infrastructure
Month 10-11: Testing and integration
Month 12:    Launch
```

### Budget: $335K-$665K

| Category | Cost |
|----------|------|
| Legal & Licensing | $50K-$100K |
| Money Custody | $30K-$75K |
| Bank Integration | $20K-$40K |
| Licensed Escrow | $30K-$75K |
| Real FX Integration | $15K-$30K |
| Infrastructure | $60K-$120K |
| Features | $80K-$150K |
| Launch | $50K-$75K |
| **TOTAL** | **$335K-$665K** |

### Transaction Fees: 2-3%
- Platform fee: 2%
- Payment processing: 0.5-1%

### Advantages ✅
- Full control over platform
- Lowest transaction fees (2-3%)
- Custom features unlimited
- No provider dependency
- Can negotiate rates
- Own the infrastructure

### Disadvantages ❌
- Very long timeline (9-12 months)
- Very high cost ($335K-$665K)
- High regulatory risk
- Complex compliance burden
- Need specialized team
- Ongoing maintenance cost

### Risk Level: 🔴 HIGH
- License rejection possible
- Regulatory delays common
- Budget overruns likely
- Technical complexity high
- Compliance burden heavy

---

## OPTION B: USE PAYFAC (Fast-Track Plan)

### Timeline: 4-6 weeks

```
Week 1-2:  Stripe Connect integration
Week 3-4:  Escrow Kenya integration
Week 5:    OpenExchangeRates integration
Week 6:    Testing and launch
```

### Budget: $25K-$50K

| Category | Cost |
|----------|------|
| Stripe Connect Setup | $0 |
| Escrow Kenya Partner | $0 (already have) |
| OpenExchangeRates | $97/year |
| Development (4 weeks) | $20K-$40K |
| Testing (1 week) | $5K-$10K |
| **TOTAL** | **$25K-$50K** |

### Transaction Fees: 4-5%
- Stripe Connect: 2.9% + $0.30
- Escrow Kenya: 1.5-2%

### Advantages ✅
- Very fast launch (4-6 weeks)
- Very low cost ($25K-$50K)
- Zero regulatory blockers
- Proven providers (Stripe, Escrow Kenya)
- Low risk
- Easy to implement
- Leverage existing partnership

### Disadvantages ❌
- Higher transaction fees (4-5%)
- Provider dependency
- Limited customization
- Subject to provider terms
- Can't negotiate rates initially

### Risk Level: 🟢 LOW
- No license required
- No regulatory delays
- Proven technology
- Simple implementation
- Low complexity

---

## SIDE-BY-SIDE COMPARISON

| Metric | Build Custom | Use PayFac | Winner |
|--------|-------------|------------|--------|
| **Timeline** | 9-12 months | 4-6 weeks | 🏆 PayFac (83% faster) |
| **Budget** | $335K-$665K | $25K-$50K | 🏆 PayFac (92% cheaper) |
| **Transaction Fees** | 2-3% | 4-5% | 🏆 Custom (2% lower) |
| **Regulatory Risk** | High | None | 🏆 PayFac |
| **Technical Risk** | High | Low | 🏆 PayFac |
| **Control** | Full | Limited | 🏆 Custom |
| **Customization** | Unlimited | Limited | 🏆 Custom |
| **Maintenance** | High | Low | 🏆 PayFac |
| **Scalability** | Manual | Automatic | 🏆 PayFac |
| **Global Expansion** | Complex | Easy | 🏆 PayFac |

---

## BREAK-EVEN ANALYSIS

### When does Custom become cheaper?

**Assumptions**:
- Custom: $500K upfront, 2% transaction fee
- PayFac: $40K upfront, 4.5% transaction fee
- Difference: 2.5% per transaction

**Break-even calculation**:
```
$460K difference / 2.5% = $18.4M in GMV
```

**Conclusion**: You need to process **$18.4M in GMV** before Custom becomes cheaper.

### Timeline to break-even:

| Monthly GMV | Months to Break-even |
|-------------|---------------------|
| $100K | 184 months (15 years) |
| $500K | 37 months (3 years) |
| $1M | 18 months |
| $2M | 9 months |
| $5M | 4 months |

**Key Insight**: Unless you expect $2M+ monthly GMV within first year, PayFac is cheaper.

---

## DECISION FRAMEWORK

### Choose BUILD CUSTOM if:
- [ ] You have 12+ months to launch
- [ ] You have $500K+ budget available
- [ ] You expect $2M+ monthly GMV within 12 months
- [ ] You have regulatory expertise in-house
- [ ] You need full control over platform
- [ ] You can handle compliance burden
- [ ] You have experienced fintech team

**Probability this applies to you**: 10%

---

### Choose USE PAYFAC if:
- [x] You need to launch in < 3 months
- [x] You have limited budget (< $100K)
- [x] You want to validate product-market fit first
- [x] You don't have regulatory expertise
- [x] You want to avoid compliance complexity
- [x] You can accept 4-5% transaction fees
- [x] You have existing Escrow Kenya partnership

**Probability this applies to you**: 90%

---

## HYBRID STRATEGY (Recommended)

### Phase 1: Launch with PayFac (Months 1-12)
**Goal**: Validate product-market fit

- Use Stripe Connect + Escrow Kenya
- Launch in 4-6 weeks
- Spend $25K-$50K
- Pay 4-5% transaction fees
- Grow to $1M+ GMV
- Learn what customers want
- Iterate quickly

**Success Metrics**:
- 1,000+ users
- $1M+ GMV
- 4.5+ star rating
- Product-market fit validated

---

### Phase 2: Evaluate Migration (Month 12)
**Goal**: Decide if custom makes sense

**If GMV < $500K/month**:
- Stay with PayFac
- 4-5% fees are acceptable
- Focus on growth, not infrastructure

**If GMV > $1M/month**:
- Consider hybrid approach
- Keep PayFac for small transactions
- Build custom for large transactions (>$1000)
- Reduce average fees to 3-4%

**If GMV > $2M/month**:
- Build custom infrastructure
- Obtain licenses
- Reduce fees to 2-3%
- Full control

---

### Phase 3: Gradual Migration (Months 12-24)
**Goal**: Reduce fees while maintaining service

- Start license applications (6-12 months)
- Build custom infrastructure in parallel
- Migrate large transactions first
- Keep PayFac as backup
- Gradual transition
- No service disruption

---

## REAL-WORLD EXAMPLES

### Companies that started with PayFac:
- **Shopify**: Started with Stripe, built Shopify Payments later
- **Uber**: Started with Braintree, built custom later
- **Airbnb**: Started with Stripe, built custom later
- **DoorDash**: Started with Stripe, built custom later

**Pattern**: Start fast with PayFac, migrate when scale justifies it.

---

### Companies that built custom from day 1:
- **PayPal**: Had to (no PayFac existed)
- **Square**: Had to (payment hardware)
- **Stripe**: They ARE the PayFac

**Pattern**: Only build custom if you ARE the payment provider.

---

## RECOMMENDATION

### For Mnbarh Platform: 🏆 USE PAYFAC (Option B)

**Reasoning**:
1. **Speed**: Launch in 4-6 weeks vs 9-12 months
2. **Cost**: $25K-$50K vs $335K-$665K
3. **Risk**: Low vs High
4. **Validation**: Test product-market fit first
5. **Partnership**: Leverage existing Escrow Kenya account
6. **Flexibility**: Can migrate later if needed

### Implementation Plan:
```
Week 1-2:  Stripe Connect integration
Week 3-4:  Escrow Kenya integration
Week 5:    OpenExchangeRates integration
Week 6:    Testing and soft launch
Month 2-3: Grow to 100+ users
Month 4-6: Grow to 1,000+ users
Month 7-12: Reach $1M+ GMV
Month 12+: Evaluate migration to custom
```

### Budget Allocation:
```
Development:        $30K (60%)
Testing & QA:       $10K (20%)
Infrastructure:     $5K  (10%)
Contingency:        $5K  (10%)
TOTAL:              $50K
```

### Success Criteria:
- [ ] Launch in 6 weeks
- [ ] 100+ transactions in Month 1
- [ ] $50K+ GMV in Month 1
- [ ] 4.5+ star rating
- [ ] < 5% churn rate
- [ ] Product-market fit validated

---

## NEXT STEPS

### Immediate (This Week):
1. ✅ Review this comparison with executive team
2. ✅ Make go/no-go decision
3. ✅ If GO: Test Escrow Kenya API access
4. ✅ If GO: Sign up for Stripe Connect
5. ✅ If GO: Allocate $50K budget

### Week 1 (If GO):
1. ⏳ Kick off Stripe Connect integration
2. ⏳ Set up development environment
3. ⏳ Create project plan
4. ⏳ Assign team members

### Week 2-6 (If GO):
1. ⏳ Execute implementation plan
2. ⏳ Weekly progress reviews
3. ⏳ Testing and QA
4. ⏳ Soft launch

---

## CONCLUSION

**The choice is clear**: Start with PayFac model (Option B).

### Why?
- **83% faster** to launch
- **92% cheaper** to implement
- **Zero regulatory blockers**
- **Low risk**
- **Leverage existing partnership**
- **Can migrate later if needed**

### The only reason to choose Custom (Option A):
- You have $500K+ budget AND
- You have 12+ months timeline AND
- You expect $2M+ monthly GMV within 12 months AND
- You have regulatory expertise AND
- You can handle compliance burden

**For 90% of startups, PayFac is the right choice.**

---

**Recommendation**: ✅ **PROCEED WITH OPTION B (PAYFAC)**

**Timeline**: 4-6 weeks  
**Budget**: $25K-$50K  
**Risk**: LOW  
**Expected Outcome**: Launch and validate product-market fit

---

*Start fast, validate, then scale. Don't build infrastructure before you have customers.*
