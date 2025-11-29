# AWS Microservices Deployment Guide

## 🏗️ Architecture Overview

This Mnbara platform is designed for deployment on **AWS Microservices Architecture** using:

- **Amazon ECS (Elastic Container Service)** - Container orchestration
- **Amazon RDS** - PostgreSQL database with PostGIS extension
- **Amazon ElastiCache** - Redis for caching and sessions
- **Amazon S3** - Static assets and file uploads
- **Amazon API Gateway** - Unified API endpoint
- **Amazon CloudFront** - CDN for frontend
- **AWS Lambda** - Serverless functions for events
- **Amazon SQS** - Message queues for async processing
- **Amazon SNS** - Push notifications

---

## 📦 Services to Deploy

| Service | Port | Container | Database | Description |
|---------|------|-----------|----------|-------------|
| **Auth Service** | 3001 | ECS Task | Shared RDS | Authentication, JWT, KYC |
| **Listing Service** | 3002 | ECS Task | Shared RDS | Products, Categories, Search |
| **Auction Service** | 3003 | ECS Task | Shared RDS | Real-time bidding |
| **Payment Service** | 3004 | ECS Task | Shared RDS | Stripe, Escrow, Wallet |
| **Crowdship Service** | 3005 | ECS Task | Shared RDS | Traveler tracking |
| **Recommendation** | 3006 | ECS Task | Shared RDS | AI/ML recommendations |
| **Rewards Service** | 3007 | ECS Task | Shared RDS | Referrals, Points |
| **Notification** | 3008 | ECS Task | Shared RDS | Email, SMS, Push |
| **Frontend (Web)** | 3000 | CloudFront+S3 | - | Next.js static export |

---

## 🚀 Deployment Steps

### Phase 1: Infrastructure Setup

#### 1. Create VPC and Subnets
```bash
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=mnbara-vpc}]'

# Create public and private subnets in 2 AZs
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

#### 2. Create RDS PostgreSQL Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier mnbara-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username mnbara_admin \
  --master-user-password CHANGE_ME \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name mnbara-db-subnet \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted \
  --tags Key=Environment,Value=production
```

#### 3. Create ElastiCache Redis Cluster
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id mnbara-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name mnbara-cache-subnet
```

#### 4. Create S3 Buckets
```bash
# For user uploads
aws s3 mb s3://mnbara-uploads --region us-east-1

# For frontend static files
aws s3 mb s3://mnbara-web --region us-east-1
```

---

### Phase 2: Container Registry

#### 1. Create ECR Repositories
```bash
# Create repository for each service
for service in auth listing auction payment crowdship recommendation rewards notification; do
  aws ecr create-repository \
    --repository-name mnbara/$service-service \
    --region us-east-1
done
```

#### 2. Build and Push Docker Images
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Build and push each service
cd services/auth-service
docker build -t mnbara/auth-service .
docker tag mnbara/auth-service:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/mnbara/auth-service:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/mnbara/auth-service:latest

# Repeat for all services...
```

---

### Phase 3: ECS Cluster Setup

#### 1. Create ECS Cluster
```bash
aws ecs create-cluster \
  --cluster-name mnbara-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

#### 2. Create Task Definitions
See `infrastructure/aws/task-definitions/` for JSON files.

```bash
aws ecs register-task-definition --cli-input-json file://infrastructure/aws/task-definitions/auth-service.json
# Repeat for all services
```

#### 3. Create ECS Services
```bash
aws ecs create-service \
  --cluster mnbara-cluster \
  --service-name auth-service \
  --task-definition mnbara-auth:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=auth-service,containerPort=3001
```

---

### Phase 4: API Gateway

#### 1. Create REST API
```bash
aws apigateway create-rest-api \
  --name mnbara-api \
  --description "Mnbara Marketplace API" \
  --endpoint-configuration types=REGIONAL
```

#### 2. Configure Routes
- `/auth/*` → Auth Service (ECS)
- `/listings/*` → Listing Service (ECS)
- `/auctions/*` → Auction Service (ECS)
- `/payments/*` → Payment Service (ECS)
- `/recommendations/*` → Recommendation Service (ECS)

---

### Phase 5: Database Migration

```bash
# Connect to RDS instance
psql -h mnbara-db.xxxxx.us-east-1.rds.amazonaws.com -U mnbara_admin -d postgres

# Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

# Run Prisma migrations from each service
cd services/auth-service
npx prisma migrate deploy

cd ../listing-service
npx prisma migrate deploy

# ... repeat for all services
```

---

### Phase 6: Frontend Deployment

#### 1. Build Next.js
```bash
cd web/mnbara-web
npm run build
npm run export  # For static export
```

#### 2. Upload to S3
```bash
aws s3 sync out/ s3://mnbara-web/ --delete
```

#### 3. Create CloudFront Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name mnbara-web.s3.amazonaws.com \
  --default-root-object index.html
```

---

## 🔐 Security Configuration

### Secrets Manager
```bash
# Store sensitive credentials
aws secretsmanager create-secret \
  --name mnbara/database \
  --secret-string '{"username":"mnbara_admin","password":"CHANGE_ME"}'

aws secretsmanager create-secret \
  --name mnbara/stripe \
  --secret-string '{"apiKey":"sk_live_xxx","webhookSecret":"whsec_xxx"}'
```

### IAM Roles
- ECS Task Execution Role (pull from ECR, write logs)
- ECS Task Role (access S3, RDS, SecretsManager)
- Lambda Execution Role (for serverless functions)

---

## 📊 Monitoring & Logging

### CloudWatch
- Container logs → CloudWatch Logs
- Metrics: CPU, Memory, Request Count
- Alarms: High error rate, latency > 2s

### X-Ray
Enable distributed tracing for all services.

---

## 💰 Cost Estimation (Monthly)

| Resource | Configuration | Est. Cost |
|----------|---------------|-----------|
| ECS Fargate (8 services × 2 tasks) | 0.5 vCPU, 1GB RAM | ~$150 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | ~$120 |
| ElastiCache Redis | cache.t3.medium | ~$65 |
| S3 + CloudFront | 100GB storage, 1TB transfer | ~$40 |
| API Gateway | 10M requests | ~$35 |
| **Total** | | **~$410/month** |

*Costs can be optimized with Reserved Instances and Savings Plans.*

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
See `.github/workflows/deploy.yml`

Pipeline stages:
1. Lint & Test
2. Build Docker images
3. Push to ECR
4. Update ECS task definitions
5. Deploy to ECS cluster
6. Run smoke tests

---

## 📱 Mobile App Backend

The same AWS infrastructure serves both web and mobile apps (iOS/Android).

Mobile-specific considerations:
- FCM/APNs integration in Notification Service
- API versioning for app updates
- Image optimization for mobile bandwidth

---

## 🌍 Multi-Region Setup (Future)

For global deployment:
1. Deploy to multiple AWS regions (us-east-1, eu-west-1, ap-southeast-1)
2. Use Route 53 for geo-routing
3. RDS cross-region read replicas
4. S3 cross-region replication

---

## 📞 Support

For deployment assistance:
- Check CloudWatch Logs
- Review ECS Service Events
- Verify Security Group rules
- Test connectivity from within VPC

---

**Next:** See `infrastructure/aws/cloudformation/` for Infrastructure-as-Code templates.
