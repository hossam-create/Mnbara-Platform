# Deploy Guide: Crowdshipping on AWS
ملف إرشادي كامل لنشر مشروع Crowdshipping على AWS — خطوات يدوية وInfrastructure-as-Code (Terraform)، ونصائح أمان وتكلفة مبدئية.

---

## overview
هذا الدليل يشرح كيفية نشر (Production-ready) المشروع على AWS مع أفضل الممارسات:
- تشغيل الـ Backend (Dockerized) على **ECS Fargate** أو **Elastic Beanstalk**
- قاعدة بيانات **RDS (PostgreSQL)** مع تخزين S3 للوسائط
- CDN عبر **CloudFront**
- شهادات TLS عبر **ACM**
- Secrets في **AWS Secrets Manager** أو **SSM Parameter Store**
- CI/CD (GitHub Actions) لبناء الصور ودفعها إلى **ECR** ونشر التحديثات
- Monitoring: **CloudWatch**, Logging, Tracing
- Security: IAM least-privilege, VPC, Subnets, Security Groups, WAF

---

## prerequisites
1. حساب AWS بالتصاريح المناسبة (IAM user أو role مع access to: EC2, ECS, ECR, RDS, S3, CloudFront, ACM, Route53, IAM, SecretsManager).
2. AWS CLI مثبت ومكوّن (`aws configure`) أو استخدام GitHub Actions secrets.
3. Terraform (اختياري) إن أردت IaC.
4. Docker وDocker Hub أو استخدام ECR.
5. نطاق (domain) جاهز لإعداد Route53 أو توجيه الـ DNS.
6. مفاتيح: STRIPE, FCM, وغيرها ستخزن في Secrets Manager.

---

## recommended architecture (short)
- VPC with public/private subnets across 2 AZs
- Application Load Balancer (ALB) -> ECS Fargate services (backend microservices)
- RDS PostgreSQL in private subnet (multi-AZ for production)
- Amazon ElastiCache (Redis) for caching + rate-limiting
- Amazon S3 for media, CloudFront distribution
- Amazon OpenSearch (optional) for search
- SQS/Kafka (MSK) or Amazon MQ for events; use Amazon Managed Kafka if required
- ECR for images, CodeBuild/Actions for CI

---

## Option A: Quick deploy (Elastic Beanstalk, simplest)
1. Build Docker image locally and push to Docker Hub (or ECR).
2. Create an Elastic Beanstalk application (Platform: Docker).
```bash
eb init -p docker crowdshipping-api
eb create crowdshipping-api-env --single
eb deploy
```
3. Configure environment variables in EB console (or use `eb setenv`).

**Pros:** سريع للبروتوتايب، إدارة تلقائية.  
**Cons:** أقل مرونة بالمقارنة مع ECS for microservices.

---

## Option B (Recommended): Production deploy with ECS Fargate + ALB
High-level steps:
1. Create ECR repositories for each service:
```bash
aws ecr create-repository --repository-name crowdshipping/user-service
aws ecr create-repository --repository-name crowdshipping/product-service
# ...
```
2. Build & push images:
```bash
$(aws ecr get-login --no-include-email)
docker build -t user-service ./services/user
docker tag user-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/crowdshipping/user-service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/crowdshipping/user-service:latest
```
3. Create ECS Cluster (Fargate), Task Definitions per service, and Services behind ALB.
4. Configure Target Groups, Health Checks (`/health`) and Auto Scaling (CPU/memory or custom metrics).
5. Setup RDS PostgreSQL (multi-AZ) and set Security Groups to allow inbound from ECS tasks.
6. Create S3 bucket for `crowdshipping-media`. Set bucket policy and CORS if needed.
7. Create CloudFront distribution with origin S3 and/or ALB.

---

## Networking & Security
- Use a custom VPC with at least 3 subnets (2 private, 1 public) across AZs.
- ALB in public subnets; ECS tasks in private subnets with NAT Gateway.
- Security Groups: ALB allows 443 from 0.0.0.0/0; ECS tasks allow from ALB SG only.
- Use IAM roles for Task Execution and Task Role (least privilege).
- Store secrets in **Secrets Manager** and reference them in Task Definitions.
- Enable AWS WAF on CloudFront/ALB to protect from common attacks.

---

## Database setup (RDS Postgres)
1. Create DB instance (Multi-AZ recommended for production).
2. Configure parameter groups, enable automated backups (retention 7–30 days).
3. Enable encryption at rest (KMS).
4. Run migrations (via migration script / Alembic / Flyway) from a bastion or CI pipeline:
```bash
PGHOST=... PGUSER=... PGPASSWORD=... psql -f migrations/001_init.sql
```

## Secrets / Environment variables
- Use Secrets Manager or SSM Parameter Store (SecureString). Example to create a secret:
```bash
aws secretsmanager create-secret --name crowdshipping/stripe --secret-string '{"STRIPE_KEY":"sk_test_xxx"}'
```
- Reference secrets in ECS Task Definition using `secrets` field.

---

## CI/CD (GitHub Actions + ECR deploy)
Sample steps (high-level):
- On push to `main`:
  - Run tests
  - Build Docker images
  - Push to ECR
  - Update ECS Service (by registering new Task Definition revision)
Provide a GitHub Actions snippet in repo (we include `/.github/workflows/deploy.yml`).

---

## Storage, Media and CDN
- S3 bucket naming: `crowdshipping-media-${ENV}`
- Use lifecycle rules (archive to Glacier) for older data.
- Use CloudFront + signed URLs for private media if required.

---

## ML / Vision / Speech
Options:
- On-device inference (recommended for privacy): use TFLite in Flutter.
- For server-side: use Amazon Rekognition + Transcribe (pay-per-use).
- Store models in S3; use SageMaker for training if needed.

---

## Monitoring, Logging, Tracing
- CloudWatch Logs for container logs (ECS).
- Use CloudWatch metrics + Alarms for CPU, memory, error rates.
- Use X-Ray for distributed tracing (instrument backend).
- Centralized dashboards in CloudWatch or Grafana.

---

## Backups & DR
- RDS automated backups + manual snapshots.
- Daily encrypted DB dumps to S3 (server-side encryption). Use the `backup_db_daily.sh` with `openssl` AES-256.
- Cross-region replication for critical data (optional).

---

## Cost estimates (starter, us-east-1, monthly approximate)
- ECS Fargate (small cluster, 3 tasks): $60–120
- RDS (db.t3.medium, multi-AZ): $100–200
- S3 (100GB): $3
- CloudFront: $10–30
- ELB/ALB: $20
- Redis (ElastiCache small): $30–60
- Misc (Lambda, Rekognition small use): $20–50
**Estimated total starting monthly:** $250–500.

---

## Terraform (optional) — basic resources snippet
We include a `terraform/` folder with sample modules:
- VPC, subnets
- ECS cluster and task definitions (templates)
- RDS instance
- S3 bucket
- ECR repos

Use:
```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

---

## Checklist before production go‑live
- [ ] Secrets stored in Secrets Manager (no secrets in repo)
- [ ] Backups configured and tested
- [ ] HTTPS via ACM + CloudFront/ALB
- [ ] WAF rules & rate limiting
- [ ] Monitoring & alerts configured
- [ ] Load testing (k6) and security scans (Snyk/OWASP ZAP)
- [ ] Legal: Terms, Privacy, GDPR compliance, KYC flows tested

---

## Useful commands (summary)
Create ECR repo:
```bash
aws ecr create-repository --repository-name crowdshipping/user-service
```
Login to ECR:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```
Build & push:
```bash
docker build -t crowdshipping/user-service ./services/user
docker tag crowdshipping/user-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/crowdshipping/user-service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/crowdshipping/user-service:latest
```

---

### Appendix: Rollback strategy
- Keep previous task definition/image tags.
- Use ECS deployment strategy (set `minimumHealthyPercent`).
- Use blue/green deployments with CodeDeploy for zero-downtime.

---

If you want, I will:
- (A) create `deploy_aws.md` file and add it to the project package, and regenerate the ZIP for download; **or**
- (B) proceed to run a test deploy on a sample AWS account (I will need your IAM access) — *I recommend A*.

Which option تريد?
