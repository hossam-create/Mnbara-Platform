# P2P Exchange Service - Incident Response Runbook

**Version**: 1.0.0  
**Last Updated**: 2026-01-28

---

## Table of Contents

1. [Incident Classification](#incident-classification)
2. [Response Procedures](#response-procedures)
3. [Common Incidents](#common-incidents)
4. [Communication Templates](#communication-templates)
5. [Post-Incident Review](#post-incident-review)

---

## Incident Classification

### Severity Levels

#### SEV1 - Critical
**Impact**: Service completely down or major data loss

**Examples**:
- Service unavailable for all users
- Database corruption
- Security breach
- Payment system failure
- Data loss

**Response Time**: Immediate (< 5 minutes)  
**Resolution Time**: < 1 hour  
**Escalation**: Immediate to CTO

#### SEV2 - High
**Impact**: Major functionality impaired

**Examples**:
- High error rate (> 5%)
- Settlement failures (> 10%)
- Matching engine down
- External provider outage
- Performance degradation

**Response Time**: < 15 minutes  
**Resolution Time**: < 4 hours  
**Escalation**: Tech Lead after 1 hour

#### SEV3 - Medium
**Impact**: Minor functionality impaired

**Examples**:
- Elevated error rate (1-5%)
- Slow response times
- Non-critical feature broken
- Monitoring alerts
- Minor bugs

**Response Time**: < 1 hour  
**Resolution Time**: < 24 hours  
**Escalation**: Tech Lead after 4 hours

#### SEV4 - Low
**Impact**: Minimal user impact

**Examples**:
- UI glitches
- Documentation errors
- Minor performance issues
- Feature requests
- Cosmetic bugs

**Response Time**: < 4 hours  
**Resolution Time**: < 1 week  
**Escalation**: Not required

---

## Response Procedures

### Initial Response (First 5 Minutes)

#### 1. Acknowledge Incident

```
#incidents channel:
"🚨 INCIDENT: [Brief description]
Severity: SEV[1-4]
Responder: [Your name]
Status: Investigating
Time: [Current time]"
```

#### 2. Assess Severity

- Check service health dashboard
- Review error rate
- Check user impact
- Determine severity level

#### 3. Assemble Team

**SEV1**: 
- On-call engineer
- Tech lead
- CTO
- Product manager

**SEV2**:
- On-call engineer
- Tech lead
- Backend engineer

**SEV3**:
- On-call engineer
- Backend engineer

**SEV4**:
- On-call engineer

#### 4. Create Incident Channel

```bash
# Create dedicated Slack channel
/create #incident-YYYYMMDD-brief-description

# Invite team members
/invite @tech-lead @backend-engineer
```

#### 5. Start Investigation

- Check monitoring dashboards
- Review error logs
- Check Sentry
- Check external provider status
- Review recent deployments

### Investigation Phase (5-30 Minutes)

#### 1. Gather Information

**Service Health**:
```bash
# Check service status
curl https://api.mnbarh.com/p2p-exchange/health

# Check metrics
curl https://api.mnbarh.com/p2p-exchange/metrics

# Check logs
tail -f logs/error.log
```

**Database**:
```bash
# Check database connection
psql -h prod-db.mnbarh.com -U postgres -d p2p_exchange -c "SELECT 1"

# Check active connections
psql -h prod-db.mnbarh.com -U postgres -d p2p_exchange -c "SELECT count(*) FROM pg_stat_activity"

# Check slow queries
psql -h prod-db.mnbarh.com -U postgres -d p2p_exchange -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"
```

**External Providers**:
```bash
# Check OpenExchangeRates
curl https://openexchangerates.org/api/latest.json?app_id=$API_KEY

# Check Tatum.io
curl https://api.tatum.io/v3/blockchain/info

# Check Stripe
curl https://api.stripe.com/v1/charges -u $STRIPE_KEY:
```

#### 2. Identify Root Cause

Common root causes:
- Recent deployment
- Database issues
- External provider outage
- Resource exhaustion
- Configuration error
- Network issues

#### 3. Update Status

```
#incident-YYYYMMDD channel:
"📊 Investigation Update:
- Service: [Status]
- Database: [Status]
- External Providers: [Status]
- Root Cause: [Suspected cause]
- Next Steps: [Actions]
Time: [Current time]"
```

### Mitigation Phase (30-60 Minutes)

#### 1. Implement Fix

**Quick Fixes**:
- Restart service
- Clear cache
- Rollback deployment
- Disable feature flag
- Scale up resources

**Temporary Workarounds**:
- Route traffic to backup
- Enable maintenance mode
- Disable non-critical features
- Manual processing

#### 2. Verify Fix

```bash
# Check service health
curl https://api.mnbarh.com/p2p-exchange/health

# Check error rate
# Check response time
# Check user reports
```

#### 3. Monitor Closely

- Watch metrics for 30 minutes
- Check for recurring issues
- Verify user experience
- Monitor error logs

### Resolution Phase

#### 1. Confirm Resolution

- All metrics normal
- No new errors
- User reports positive
- Team consensus

#### 2. Update Status

```
#incident-YYYYMMDD channel:
"✅ RESOLVED: [Brief description]
Duration: [Duration]
Root Cause: [Cause]
Fix: [What was done]
Impact: [User impact]
Time: [Current time]"
```

#### 3. Communicate Resolution

```
#incidents channel:
"✅ INCIDENT RESOLVED
Incident: [Brief description]
Severity: SEV[1-4]
Duration: [Duration]
Impact: [User impact]
Root Cause: [Cause]
Fix: [What was done]
Post-Mortem: [Link to doc]"
```

---

## Common Incidents

### Service Down

**Symptoms**:
- Health check failing
- All requests returning 500
- Container not running

**Diagnosis**:
```bash
# Check container status
docker ps | grep p2p-exchange

# Check container logs
docker logs p2p-exchange-service

# Check system resources
top
df -h
```

**Resolution**:
```bash
# Restart service
docker-compose restart p2p-exchange-service

# Or redeploy
./scripts/deploy-production.sh

# If persistent, rollback
./scripts/rollback-production.sh
```

### High Error Rate

**Symptoms**:
- Error rate > 5%
- Sentry alerts
- User complaints

**Diagnosis**:
```bash
# Check error logs
tail -f logs/error.log | grep ERROR

# Check Sentry
# Check error patterns
# Check recent changes
```

**Resolution**:
- Fix identified errors
- Rollback if deployment-related
- Disable problematic feature
- Scale up if resource issue

### Database Connection Failed

**Symptoms**:
- "Cannot connect to database" errors
- All database operations failing
- Health check failing

**Diagnosis**:
```bash
# Check database status
psql -h prod-db.mnbarh.com -U postgres -d p2p_exchange -c "SELECT 1"

# Check connection pool
# Check database logs
# Check network connectivity
```

**Resolution**:
```bash
# Restart database connection pool
docker-compose restart p2p-exchange-service

# Check database credentials
# Check firewall rules
# Contact database provider
```

### Settlement Failures

**Symptoms**:
- Settlement success rate < 90%
- Multiple failed settlements
- User complaints about payments

**Diagnosis**:
```bash
# Check settlement logs
grep "settlement" logs/combined.log | grep "failed"

# Check PSP status
# Check external provider status
# Check specific failed settlements
```

**Resolution**:
```bash
# Retry failed settlements
curl -X POST https://api.mnbarh.com/admin/exchange/settlements/retry-all

# Check PSP credentials
# Contact PSP support
# Manual settlement if needed
```

### Matching Engine Not Running

**Symptoms**:
- No new matches created
- Matching engine metrics flat
- User complaints about no matches

**Diagnosis**:
```bash
# Check cron job status
docker exec p2p-exchange-service crontab -l

# Check matching engine logs
grep "matching-engine" logs/combined.log

# Check for errors
```

**Resolution**:
```bash
# Restart cron service
docker exec p2p-exchange-service service cron restart

# Or restart entire service
docker-compose restart p2p-exchange-service

# Manual matching if needed
curl -X POST https://api.mnbarh.com/admin/exchange/matching/run-now
```

### External Provider Outage

**Symptoms**:
- External provider errors
- Specific functionality failing
- Provider status page shows outage

**Diagnosis**:
```bash
# Check provider status
curl https://status.openexchangerates.org
curl https://status.tatum.io
curl https://status.stripe.com

# Check error logs for provider errors
grep "OpenExchangeRates\|Tatum\|Stripe" logs/error.log
```

**Resolution**:
- Wait for provider recovery
- Switch to backup provider (if available)
- Enable fallback mode
- Notify users of degraded service

### Memory Leak

**Symptoms**:
- Memory usage increasing over time
- Service becomes slow
- Eventually crashes

**Diagnosis**:
```bash
# Check memory usage
docker stats p2p-exchange-service

# Check for memory leaks
# Review recent code changes
# Check for unclosed connections
```

**Resolution**:
```bash
# Immediate: Restart service
docker-compose restart p2p-exchange-service

# Long-term: Fix memory leak
# Add memory monitoring
# Implement automatic restarts
```

### Disk Space Full

**Symptoms**:
- "No space left on device" errors
- Cannot write logs
- Database writes failing

**Diagnosis**:
```bash
# Check disk usage
df -h

# Find large files
du -sh /* | sort -h

# Check log files
du -sh logs/*
```

**Resolution**:
```bash
# Clean up old logs
find logs/ -name "*.log" -mtime +7 -delete

# Rotate logs
logrotate -f /etc/logrotate.conf

# Increase disk size (long-term)
```

---

## Communication Templates

### Initial Incident Notification

```
Subject: [SEV1/SEV2] P2P Exchange Service Incident

Team,

We are experiencing an incident with the P2P Exchange Service.

Severity: SEV[1-4]
Impact: [Description of user impact]
Status: Investigating
Started: [Time]

We are actively investigating and will provide updates every 15 minutes.

Incident Channel: #incident-YYYYMMDD-description
Incident Commander: [Name]

Updates will be posted in the incident channel.
```

### Status Update

```
Subject: [SEV1/SEV2] P2P Exchange Service - Update

Team,

Update on the P2P Exchange Service incident:

Status: [Investigating/Mitigating/Resolved]
Root Cause: [Known/Suspected cause]
Current Actions: [What we're doing]
ETA: [Estimated resolution time]

Next update in 15 minutes or when status changes.
```

### Resolution Notification

```
Subject: [RESOLVED] P2P Exchange Service Incident

Team,

The P2P Exchange Service incident has been resolved.

Duration: [Duration]
Root Cause: [Cause]
Fix Applied: [What was done]
User Impact: [Description]

Post-Mortem: [Link to document]

The service is now operating normally. We will continue to monitor closely.

Thank you for your patience and support.
```

### User Communication (if needed)

```
Subject: Service Disruption - P2P Exchange

Dear Users,

We experienced a temporary disruption to our P2P Exchange service today.

What Happened: [Brief description]
Duration: [Duration]
Impact: [What users experienced]
Resolution: [What we did]

We apologize for any inconvenience this may have caused. The service is now fully operational.

If you experienced any issues with your transactions, please contact support@mnbarh.com.

Thank you for your understanding.
```

---

## Post-Incident Review

### Post-Mortem Template

**Incident Summary**:
- Date and time
- Duration
- Severity
- Impact

**Timeline**:
- [Time] - Incident detected
- [Time] - Team assembled
- [Time] - Root cause identified
- [Time] - Fix implemented
- [Time] - Incident resolved

**Root Cause**:
- What happened
- Why it happened
- Contributing factors

**Resolution**:
- What was done
- Why it worked
- Temporary vs permanent fix

**Impact**:
- Users affected
- Transactions affected
- Revenue impact
- Reputation impact

**What Went Well**:
- Quick detection
- Fast response
- Good communication
- Effective fix

**What Could Be Improved**:
- Earlier detection
- Faster response
- Better monitoring
- Preventive measures

**Action Items**:
- [ ] Improve monitoring
- [ ] Add alerts
- [ ] Update runbooks
- [ ] Implement preventive measures
- [ ] Train team

**Lessons Learned**:
- Key takeaways
- Best practices
- Things to avoid

### Post-Mortem Meeting

**Attendees**:
- Incident responders
- Tech lead
- Product manager
- Relevant stakeholders

**Agenda**:
1. Review timeline
2. Discuss root cause
3. Review response
4. Identify improvements
5. Assign action items

**Follow-Up**:
- Share post-mortem document
- Track action items
- Update runbooks
- Implement improvements

---

## Escalation Procedures

### When to Escalate

**To Tech Lead**:
- SEV2 incident > 1 hour
- SEV3 incident > 4 hours
- Unclear root cause
- Need additional resources

**To CTO**:
- SEV1 incident (immediate)
- SEV2 incident > 4 hours
- Security breach
- Data loss
- Legal implications

**To CEO**:
- Major security breach
- Significant data loss
- Legal action
- PR crisis
- Regulatory issues

### How to Escalate

1. **Notify via PagerDuty**: Automatic for SEV1
2. **Call directly**: For urgent issues
3. **Slack**: Tag in incident channel
4. **Email**: For non-urgent escalations

### Escalation Template

```
Subject: ESCALATION: [SEV1/SEV2] P2P Exchange Incident

[Name],

I am escalating the P2P Exchange incident for your attention.

Severity: SEV[1-4]
Duration: [Duration so far]
Impact: [User impact]
Root Cause: [Known/Unknown]
Actions Taken: [What we've tried]
Reason for Escalation: [Why escalating]

Incident Channel: #incident-YYYYMMDD-description

Please advise on next steps.
```

---

## Emergency Contacts

### Internal

- **On-Call Engineer**: PagerDuty
- **Tech Lead**: +1-555-TECH-LEAD
- **CTO**: +1-555-CTO
- **CEO**: +1-555-CEO

### External

- **AWS Support**: +1-800-AWS-SUPPORT
- **Database Provider**: support@provider.com
- **OpenExchangeRates**: support@openexchangerates.org
- **Tatum.io**: support@tatum.io
- **Stripe**: support@stripe.com

### Monitoring

- **Grafana**: https://grafana.mnbarh.com
- **Sentry**: https://sentry.io
- **Status Page**: https://status.mnbarh.com

---

## Incident Log

| Date | Severity | Duration | Root Cause | Resolution |
|------|----------|----------|------------|------------|
| 2026-01-28 | SEV3 | 15 min | Cache issue | Cache cleared |

---

**For Incident Support**: Contact ops@mnbarh.com or call +1-555-ONCALL (24/7)

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0
