# 🚀 Mnbarh Platform - 24 Hour Launch Runbook
# خطة الإطلاق الطارئ - 24 ساعة

## 📋 Pre-Launch Checklist

### Security (Hours 0-3)
- [ ] Run `./scripts/run-gitleaks.sh` and review report
- [ ] Rotate any exposed secrets (see `security/ROTATE_SECRETS.md`)
- [ ] Verify Vault/K8s secrets are configured
- [ ] Close GitHub Issue for security sweep

### Configuration (Hours 3-6)
- [ ] Set `PAYMENT_MODE=sandbox` in all environments
- [ ] Set `DISABLE_AI=true` to reduce load
- [ ] Set `LAUNCH_SCOPE=beta-only`
- [ ] Verify database backups are enabled

### Infrastructure (Hours 6-10)
- [ ] Deploy to staging namespace first
- [ ] Verify all healthchecks pass
- [ ] Run smoke tests (auth, listing, cart, checkout)
- [ ] Check Prometheus/Grafana dashboards

### Go-Live (Hours 10-24)
- [ ] Deploy to production with replicas=1-2
- [ ] Monitor error rates (target: <1%)
- [ ] Monitor latency P95 (target: <500ms)
- [ ] Enable beta user access only

---

## 🛠️ Quick Commands

### Start Services (Development)
```bash
docker-compose up -d postgres redis elasticsearch
docker-compose up -d api-gateway auth-service-java listing-service-node
```

### Health Check
```bash
curl http://localhost:8080/health
curl http://localhost:3001/health  # auth
curl http://localhost:3002/health  # listing
```

### View Logs
```bash
docker-compose logs -f api-gateway
docker-compose logs -f --tail=100
```

### Rollback
```bash
# Scale down
docker-compose stop api-gateway auth-service-java listing-service-node

# Or git revert
git revert HEAD
git push
```

---

## 🚨 Emergency Procedures

### If Payments Fail
1. Set `PAYMENT_ENABLED=false` in environment
2. Restart payment-service
3. Notify users: "المدفوعات متوقفة مؤقتاً"
4. Debug in sandbox mode

### If Database Crashes
1. Stop all write operations
2. Restore from last snapshot
3. Verify data integrity
4. Resume operations

### If Secrets Leaked
1. Immediately rotate all exposed keys
2. Run `./scripts/run-gitleaks.sh`
3. Follow `security/ROTATE_SECRETS.md`
4. Notify security team

---

## 📊 Success Metrics (First 24 Hours)

| Metric | Target |
|--------|--------|
| Uptime | >99% |
| Error Rate | <1% |
| P95 Latency | <500ms |
| Successful Checkouts | >90% attempts |
| DB Connections | <80% limit |

---

## 👥 On-Call Contacts

| Role | Responsibility |
|------|----------------|
| Lead Engineer | Overall system health |
| DevOps | Infrastructure issues |
| Backend | API/Service issues |
| Security | Credential management |

---

## 📝 Post-Launch Tasks (After 24 Hours)

1. [ ] Review all error logs
2. [ ] Analyze performance metrics
3. [ ] Enable AI/Recommendation services gradually
4. [ ] Expand to public access
5. [ ] Switch to production payment mode
6. [ ] Document lessons learned

---

**Last Updated:** December 29, 2025
**Version:** 1.0.0
