# DNS Configuration for Mnbara Platform
# Production Domain Setup - Final 5% Completion

## Domain: mnbarh.com

### Required DNS Records

#### A Records (IPv4)
```
mnbarh.com                    A    <LOAD_BALANCER_IP>
www.mnbarh.com               A    <LOAD_BALANCER_IP>
api.mnbarh.com               A    <LOAD_BALANCER_IP>
monitoring.mnbarh.com        A    <LOAD_BALANCER_IP>
status.mnbarh.com            A    <LOAD_BALANCER_IP>
```

#### AAAA Records (IPv6) - Optional
```
mnbarh.com                    AAAA <LOAD_BALANCER_IPv6>
www.mnbarh.com               AAAA <LOAD_BALANCER_IPv6>
api.mnbarh.com               AAAA <LOAD_BALANCER_IPv6>
monitoring.mnbarh.com        AAAA <LOAD_BALANCER_IPv6>
status.mnbarh.com            AAAA <LOAD_BALANCER_IPv6>
```

#### CNAME Records
```
cdn.mnbarh.com               CNAME <CDN_ENDPOINT>
assets.mnbarh.com            CNAME <CDN_ENDPOINT>
images.mnbarh.com            CNAME <CDN_ENDPOINT>
```

#### MX Records (Email)
```
mnbarh.com                   MX   10 mail.mnbarh.com
```

#### TXT Records
```
mnbarh.com                   TXT  "v=spf1 include:_spf.google.com ~all"
_dmarc.mnbarh.com           TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@mnbarh.com"
google._domainkey.mnbarh.com TXT  "v=DKIM1; k=rsa; p=<GOOGLE_DKIM_KEY>"
```

#### SRV Records (Optional)
```
_sip._tcp.mnbarh.com        SRV  10 5 5060 sip.mnbarh.com
```

### DNS Configuration by Provider

#### Cloudflare Configuration
```bash
# Install Cloudflare CLI
curl -L https://github.com/cloudflare/cloudflare-go/releases/latest/download/flarectl-linux-amd64.tar.gz | tar xz

# Configure DNS records
flarectl dns create --zone mnbarh.com --name @ --type A --content <LOAD_BALANCER_IP> --ttl 300
flarectl dns create --zone mnbarh.com --name www --type A --content <LOAD_BALANCER_IP> --ttl 300
flarectl dns create --zone mnbarh.com --name api --type A --content <LOAD_BALANCER_IP> --ttl 300
flarectl dns create --zone mnbarh.com --name monitoring --type A --content <LOAD_BALANCER_IP> --ttl 300
flarectl dns create --zone mnbarh.com --name status --type A --content <LOAD_BALANCER_IP> --ttl 300

# Enable Cloudflare proxy (orange cloud)
flarectl dns update --zone mnbarh.com --name @ --proxy
flarectl dns update --zone mnbarh.com --name www --proxy
```

#### AWS Route 53 Configuration
```bash
# Create hosted zone
aws route53 create-hosted-zone --name mnbarh.com --caller-reference $(date +%s)

# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='mnbarh.com.'].Id" --output text | cut -d'/' -f3)

# Create A records
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "mnbarh.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "<LOAD_BALANCER_IP>"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.mnbarh.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "<LOAD_BALANCER_IP>"}]
      }
    }
  ]
}'
```

#### Google Cloud DNS Configuration
```bash
# Create DNS zone
gcloud dns managed-zones create mnbarh-zone --dns-name=mnbarh.com. --description="Mnbara Platform DNS Zone"

# Add A records
gcloud dns record-sets transaction start --zone=mnbarh-zone
gcloud dns record-sets transaction add <LOAD_BALANCER_IP> --name=mnbarh.com. --ttl=300 --type=A --zone=mnbarh-zone
gcloud dns record-sets transaction add <LOAD_BALANCER_IP> --name=www.mnbarh.com. --ttl=300 --type=A --zone=mnbarh-zone
gcloud dns record-sets transaction add <LOAD_BALANCER_IP> --name=api.mnbarh.com. --ttl=300 --type=A --zone=mnbarh-zone
gcloud dns record-sets transaction execute --zone=mnbarh-zone
```

### Load Balancer IP Discovery

#### AWS ELB
```bash
# Get ELB DNS name
aws elbv2 describe-load-balancers --names mnbarh-production --query 'LoadBalancers[0].DNSName' --output text

# Get ELB IP (for A record)
nslookup $(aws elbv2 describe-load-balancers --names mnbarh-production --query 'LoadBalancers[0].DNSName' --output text)
```

#### Google Cloud Load Balancer
```bash
# Get external IP
gcloud compute addresses describe mnbarh-ip --global --format="value(address)"
```

#### Azure Load Balancer
```bash
# Get public IP
az network public-ip show --resource-group mnbarh-rg --name mnbarh-ip --query ipAddress --output tsv
```

#### Kubernetes Ingress
```bash
# Get ingress external IP
kubectl get ingress mnbarh-ingress -n mnbarh-production -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Or get service external IP
kubectl get service nginx-proxy-service -n mnbarh-production -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### DNS Propagation Check

#### Check DNS propagation globally
```bash
# Using dig
dig @8.8.8.8 mnbarh.com A
dig @1.1.1.1 mnbarh.com A
dig @208.67.222.222 mnbarh.com A

# Using nslookup
nslookup mnbarh.com 8.8.8.8
nslookup mnbarh.com 1.1.1.1

# Using online tools
curl -s "https://dns.google/resolve?name=mnbarh.com&type=A" | jq .
```

#### DNS propagation monitoring script
```bash
#!/bin/bash
# dns-check.sh

DOMAIN="mnbarh.com"
EXPECTED_IP="<LOAD_BALANCER_IP>"

DNS_SERVERS=(
    "8.8.8.8"      # Google
    "1.1.1.1"      # Cloudflare
    "208.67.222.222" # OpenDNS
    "9.9.9.9"      # Quad9
)

echo "Checking DNS propagation for $DOMAIN"
echo "Expected IP: $EXPECTED_IP"
echo "=================================="

for dns in "${DNS_SERVERS[@]}"; do
    result=$(dig @$dns $DOMAIN A +short | head -n1)
    if [ "$result" = "$EXPECTED_IP" ]; then
        echo "✅ $dns: $result (CORRECT)"
    else
        echo "❌ $dns: $result (INCORRECT)"
    fi
done
```

### SSL Certificate Verification

#### Check SSL certificate
```bash
# Check certificate details
openssl s_client -servername mnbarh.com -connect mnbarh.com:443 -showcerts

# Check certificate expiration
echo | openssl s_client -servername mnbarh.com -connect mnbarh.com:443 2>/dev/null | openssl x509 -noout -dates

# Check certificate chain
curl -I https://mnbarh.com
```

### Performance Optimization

#### CDN Configuration
```bash
# Cloudflare settings
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 2 hours
- Always Online: On
- Auto Minify: CSS, JS, HTML
- Brotli Compression: On
- HTTP/2: On
- HTTP/3 (QUIC): On
```

#### DNS Performance
```bash
# Set optimal TTL values
- A records: 300 seconds (5 minutes)
- CNAME records: 3600 seconds (1 hour)
- MX records: 3600 seconds (1 hour)
- TXT records: 3600 seconds (1 hour)
```

### Monitoring and Alerts

#### DNS monitoring script
```bash
#!/bin/bash
# dns-monitor.sh

DOMAIN="mnbarh.com"
EXPECTED_IP="<LOAD_BALANCER_IP>"

while true; do
    current_ip=$(dig +short $DOMAIN A | head -n1)
    
    if [ "$current_ip" != "$EXPECTED_IP" ]; then
        echo "ALERT: DNS record changed! Current: $current_ip, Expected: $EXPECTED_IP"
        # Send alert notification
        curl -X POST "$WEBHOOK_URL" -d "{\"text\":\"DNS Alert: $DOMAIN IP changed to $current_ip\"}"
    else
        echo "DNS OK: $DOMAIN -> $current_ip"
    fi
    
    sleep 300  # Check every 5 minutes
done
```

### Troubleshooting

#### Common DNS Issues
1. **Propagation Delay**: DNS changes can take 24-48 hours to propagate globally
2. **TTL Too High**: Lower TTL values for faster updates during launch
3. **Caching**: Clear local DNS cache: `sudo systemctl flush-dns` (Linux) or `ipconfig /flushdns` (Windows)
4. **Wrong IP**: Verify load balancer IP hasn't changed

#### DNS Testing Commands
```bash
# Test all subdomains
for subdomain in "" "www" "api" "monitoring" "status"; do
    if [ -z "$subdomain" ]; then
        domain="mnbarh.com"
    else
        domain="$subdomain.mnbarh.com"
    fi
    echo "Testing $domain:"
    curl -I "https://$domain" | head -n1
done
```

### Launch Day DNS Checklist

- [ ] All A records pointing to correct load balancer IP
- [ ] WWW redirect working (www.mnbarh.com → mnbarh.com)
- [ ] API subdomain resolving (api.mnbarh.com)
- [ ] Monitoring subdomain resolving (monitoring.mnbarh.com)
- [ ] Status page subdomain resolving (status.mnbarh.com)
- [ ] SSL certificates valid for all domains
- [ ] DNS propagation complete globally
- [ ] CDN configuration optimized
- [ ] DNS monitoring alerts configured

### Post-Launch DNS Management

1. **Monitor DNS performance** using tools like DNSPerf
2. **Set up DNS failover** for high availability
3. **Configure geographic DNS routing** for global users
4. **Regular SSL certificate renewal** (automated via cert-manager)
5. **DNS security** with DNSSEC and DNS filtering

---

**Status**: ✅ DNS Configuration Ready for Launch
**Last Updated**: December 22, 2025
**Launch Date**: January 1, 2026 🚀