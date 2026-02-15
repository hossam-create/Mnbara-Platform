# AWS Setup Guide - Mnbara Platform

**التاريخ**: 2 فبراير 2026  
**الهدف**: إعداد AWS Infrastructure للـ MVP

---

## 📋 المتطلبات

- AWS Account
- AWS CLI installed
- Domain name (optional)
- Budget: ~$100/month للتطوير

---

## 🏗️ البنية المعمارية

```
Internet
    ↓
Application Load Balancer (ALB)
    ↓
┌─────────────────────────────┐
│   Auto Scaling Group        │
│  ┌──────┐      ┌──────┐    │
│  │ EC2  │      │ EC2  │    │
│  │  #1  │      │  #2  │    │
│  └──────┘      └──────┘    │
└─────────────────────────────┘
         ↓              ↓
    ┌────────┐    ┌──────────┐
    │  RDS   │    │ElastiCache│
    │  (PG)  │    │  (Redis) │
    └────────┘    └──────────┘
```

---

## 🚀 خطوات الإعداد

### Step 1: إنشاء VPC

```bash
# Create VPC
aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=mnbara-vpc}]'

# Create Subnets
# Public Subnet 1 (us-east-1a)
aws ec2 create-subnet \
    --vpc-id vpc-xxxxx \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mnbara-public-1a}]'

# Public Subnet 2 (us-east-1b)
aws ec2 create-subnet \
    --vpc-id vpc-xxxxx \
    --cidr-block 10.0.2.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mnbara-public-1b}]'

# Private Subnet 1 (us-east-1a)
aws ec2 create-subnet \
    --vpc-id vpc-xxxxx \
    --cidr-block 10.0.11.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mnbara-private-1a}]'

# Private Subnet 2 (us-east-1b)
aws ec2 create-subnet \
    --vpc-id vpc-xxxxx \
    --cidr-block 10.0.12.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mnbara-private-1b}]'

# Create Internet Gateway
aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=mnbara-igw}]'

# Attach to VPC
aws ec2 attach-internet-gateway \
    --vpc-id vpc-xxxxx \
    --internet-gateway-id igw-xxxxx
```

### Step 2: إنشاء Security Groups

```bash
# Security Group for ALB
aws ec2 create-security-group \
    --group-name mnbara-alb-sg \
    --description "Security group for ALB" \
    --vpc-id vpc-xxxxx

# Allow HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Security Group for EC2
aws ec2 create-security-group \
    --group-name mnbara-ec2-sg \
    --description "Security group for EC2 instances" \
    --vpc-id vpc-xxxxx

# Allow traffic from ALB
aws ec2 authorize-security-group-ingress \
    --group-id sg-yyyyy \
    --protocol tcp \
    --port 3000-3030 \
    --source-group sg-xxxxx

# Allow SSH (for deployment)
aws ec2 authorize-security-group-ingress \
    --group-id sg-yyyyy \
    --protocol tcp \
    --port 22 \
    --cidr YOUR_IP/32

# Security Group for RDS
aws ec2 create-security-group \
    --group-name mnbara-rds-sg \
    --description "Security group for RDS" \
    --vpc-id vpc-xxxxx

# Allow PostgreSQL from EC2
aws ec2 authorize-security-group-ingress \
    --group-id sg-zzzzz \
    --protocol tcp \
    --port 5432 \
    --source-group sg-yyyyy

# Security Group for ElastiCache
aws ec2 create-security-group \
    --group-name mnbara-redis-sg \
    --description "Security group for Redis" \
    --vpc-id vpc-xxxxx

# Allow Redis from EC2
aws ec2 authorize-security-group-ingress \
    --group-id sg-wwwww \
    --protocol tcp \
    --port 6379 \
    --source-group sg-yyyyy
```

### Step 3: إنشاء RDS (PostgreSQL)

```bash
# Create DB Subnet Group
aws rds create-db-subnet-group \
    --db-subnet-group-name mnbara-db-subnet \
    --db-subnet-group-description "Subnet group for Mnbara RDS" \
    --subnet-ids subnet-xxxxx subnet-yyyyy

# Create RDS Instance
aws rds create-db-instance \
    --db-instance-identifier mnbara-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username mnbarh \
    --master-user-password 'YOUR_SECURE_PASSWORD' \
    --allocated-storage 20 \
    --storage-type gp3 \
    --vpc-security-group-ids sg-zzzzz \
    --db-subnet-group-name mnbara-db-subnet \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00" \
    --preferred-maintenance-window "mon:04:00-mon:05:00" \
    --multi-az \
    --publicly-accessible false \
    --storage-encrypted \
    --enable-cloudwatch-logs-exports '["postgresql"]'
```

### Step 4: إنشاء ElastiCache (Redis)

```bash
# Create Cache Subnet Group
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name mnbara-redis-subnet \
    --cache-subnet-group-description "Subnet group for Mnbara Redis" \
    --subnet-ids subnet-xxxxx subnet-yyyyy

# Create Redis Cluster
aws elasticache create-cache-cluster \
    --cache-cluster-id mnbara-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --engine-version 7.0 \
    --num-cache-nodes 1 \
    --cache-subnet-group-name mnbara-redis-subnet \
    --security-group-ids sg-wwwww \
    --preferred-maintenance-window "mon:05:00-mon:06:00"
```

### Step 5: إنشاء EC2 Instances

```bash
# Create Key Pair
aws ec2 create-key-pair \
    --key-name mnbara-key \
    --query 'KeyMaterial' \
    --output text > mnbara-key.pem

chmod 400 mnbara-key.pem

# Launch EC2 Instance
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \
    --instance-type t3.small \
    --key-name mnbara-key \
    --security-group-ids sg-yyyyy \
    --subnet-id subnet-xxxxx \
    --user-data file://scripts/ec2-user-data.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=mnbara-backend-1}]' \
    --iam-instance-profile Name=mnbara-ec2-role \
    --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]'
```

### Step 6: إنشاء Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name mnbara-alb \
    --subnets subnet-xxxxx subnet-yyyyy \
    --security-groups sg-xxxxx \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4

# Create Target Group
aws elbv2 create-target-group \
    --name mnbara-backend-tg \
    --protocol HTTP \
    --port 80 \
    --vpc-id vpc-xxxxx \
    --health-check-protocol HTTP \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3

# Register Targets
aws elbv2 register-targets \
    --target-group-arn arn:aws:elasticloadbalancing:... \
    --targets Id=i-xxxxx Id=i-yyyyy

# Create Listener
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:elasticloadbalancing:... \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 7: إنشاء S3 Buckets

```bash
# Create S3 bucket for uploads
aws s3 mb s3://mnbara-uploads --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket mnbara-uploads \
    --versioning-configuration Status=Enabled

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
    --bucket mnbara-uploads \
    --lifecycle-configuration file://s3-lifecycle.json

# Create S3 bucket for backups
aws s3 mb s3://mnbara-backups --region us-east-1
```

---

## 🔐 IAM Roles & Policies

### EC2 Instance Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 📊 التكلفة المتوقعة

| الخدمة | النوع | التكلفة الشهرية |
|--------|------|-----------------|
| EC2 (x2) | t3.small | $30 |
| RDS | db.t3.micro | $15 |
| ElastiCache | cache.t3.micro | $12 |
| ALB | - | $20 |
| S3 | 100GB | $5 |
| Data Transfer | 100GB | $10 |
| **المجموع** | | **~$92/month** |

---

## ✅ التحقق من الإعداد

```bash
# Check VPC
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=mnbara-vpc"

# Check EC2
aws ec2 describe-instances --filters "Name=tag:Name,Values=mnbara-backend-*"

# Check RDS
aws rds describe-db-instances --db-instance-identifier mnbara-db

# Check ElastiCache
aws elasticache describe-cache-clusters --cache-cluster-id mnbara-redis

# Check ALB
aws elbv2 describe-load-balancers --names mnbara-alb
```

---

## 🚀 الخطوة التالية

بعد إعداد AWS Infrastructure:

1. تحديث GitHub Secrets
2. تشغيل أول deployment
3. اختبار CI/CD pipeline
4. إعداد monitoring

---

**الحالة**: 📝 دليل جاهز للتنفيذ  
**الوقت المتوقع**: 4-6 ساعات للإعداد الكامل
