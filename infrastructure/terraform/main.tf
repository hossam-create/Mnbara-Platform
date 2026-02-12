# =============================================================================
# Mnbara Platform - Terraform Main Configuration
# =============================================================================
# This file is the entry point for the Mnbara Platform infrastructure
# It orchestrates all modules and resources
# =============================================================================

# =============================================================================
# Provider Configuration
# =============================================================================
# Providers are configured in providers.tf
# =============================================================================

# =============================================================================
# Variables
# =============================================================================
# Variables are defined in variables.tf
# =============================================================================

# =============================================================================
# Remote State Configuration
# =============================================================================
# Store Terraform state remotely for team collaboration
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  # Remote state backend (configure in terraform.tfvars or environment)
  backend "s3" {
    bucket         = "${terraform_state_bucket}"
    key            = "mnbara-platform/terraform.tfstate"
    region         = "${aws_region}"
    encrypt        = true
    dynamodb_table = "${terraform_state_lock_table}"
  }

  # Module source configuration
  # Can be changed to use local modules during development
  source = "./modules"
}

# =============================================================================
# Data Sources
# =============================================================================
# Fetch external information
# =============================================================================

# Get AWS caller identity
data "aws_caller_identity" "current" {}

# Get AWS regions
data "aws_regions" "available" {
  name = var.aws_region
}

# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# Local Values
# =============================================================================
# Local values for reuse within this configuration
# =============================================================================

locals {
  # Common tags applied to all resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.owner
    CostCenter  = var.cost_center
    Repository  = var.repository_url
  }

  # Service names
  service_name = var.project_name
  environment  = var.environment

  # VPC configuration
  vpc_cidr = var.vpc_cidr

  # Subnet configurations
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

# =============================================================================
# Network Module
# =============================================================================
# VPC, subnets, and network configuration
# =============================================================================

module "network" {
  source = "./modules/network"

  # Naming
  name_prefix = "${local.service_name}-${local.environment}"
  vpc_name    = "${local.service_name}-vpc"

  # CIDR blocks
  vpc_cidr = local.vpc_cidr

  # Subnet configuration
  public_subnets  = local.public_subnets
  private_subnets = local.private_subnets

  # Availability zones
  availability_zones = data.aws_availability_zones.available.names

  # Tags
  tags = local.common_tags

  # DNS configuration
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support
}

# =============================================================================
# Security Groups Module
# =============================================================================
# Security group configuration for services
# =============================================================================

module "security_groups" {
  source = "./modules/security-groups"

  # Dependencies
  vpc_id = module.network.vpc_id

  # Naming
  name_prefix = "${local.service_name}-${local.environment}"

  # Tags
  tags = local.common_tags

  # Environment-specific settings
  environment = var.environment

  # Allow from security groups
  allowed_sg_ids = []
}

# =============================================================================
# RDS Module
# =============================================================================
# PostgreSQL database configuration
# =============================================================================

module "rds" {
  source = "./modules/rds"

  # Identifier
  identifier = "${local.service_name}-${local.environment}"

  # Database configuration
  engine               = var.rds_engine
  engine_version       = var.rds_engine_version
  instance_class       = var.rds_instance_class
  db_name              = var.rds_db_name
  username             = var.rds_username
  password             = var.rds_password
  port                 = var.rds_port

  # Network configuration
  vpc_id               = module.network.vpc_id
  subnet_ids           = module.network.private_subnet_ids
  security_group_ids   = [module.security_groups.rds_sg_id]

  # Backup configuration
  backup_retention_period = var.rds_backup_retention
  backup_window            = var.rds_backup_window

  # Maintenance configuration
  maintenance_window = var.rds_maintenance_window

  # Storage
  allocated_storage = var.rds_allocated_storage
  storage_encrypted = var.rds_storage_encrypted

  # Tags
  tags = local.common_tags

  # Skip final snapshot for dev environments
  skip_final_snapshot = var.environment == "dev"
}

# =============================================================================
# ElastiCache (Redis) Module
# =============================================================================
# Redis cache configuration
# =============================================================================

module "redis" {
  source = "./modules/redis"

  # Identifier
  identifier = "${local.service_name}-${local.environment}"

  # Engine configuration
  engine              = "redis"
  engine_version      = var.redis_engine_version
  node_type           = var.redis_node_type
  num_cache_nodes     = var.redis_num_nodes
  parameter_group_name = var.redis_parameter_group

  # Network configuration
  vpc_id             = module.network.vpc_id
  subnet_ids         = module.network.private_subnet_ids
  security_group_ids = [module.security_groups.redis_sg_id]

  # Replication
  at_rest_encryption_enabled = var.redis_encryption_enabled
  transit_encryption_enabled  = var.redis_transport_encryption

  # Tags
  tags = local.common_tags
}

# =============================================================================
# Elasticsearch Module
# =============================================================================
# Elasticsearch cluster for search functionality
# =============================================================================

module "elasticsearch" {
  source = "./modules/elasticsearch"

  # Identifier
  domain_name = "${local.service_name}-${local.environment}"

  # Engine configuration
  engine_version        = var.es_engine_version
  instance_type         = var.es_instance_type
  instance_count        = var.es_instance_count
  dedicated_master_type = var.es_master_instance_type
  dedicated_master_count = var.es_master_instance_count

  # Storage
  volume_size = var.es_volume_size

  # Network configuration
  vpc_id             = module.network.vpc_id
  subnet_ids         = module.network.private_subnet_ids
  security_group_ids = [module.security_groups.elasticsearch_sg_id]

  # Security
  enable_encryption_at_rest   = var.es_encryption_enabled
  enable_node_to_node_encryption = var.es_node_to_node_encryption

  # Tags
  tags = local.common_tags
}

# =============================================================================
# S3 Buckets Module
# =============================================================================
# S3 bucket configuration for storage
# =============================================================================

module "s3" {
  source = "./modules/s3"

  # Bucket configuration
  bucket_prefix = "${local.service_name}-${local.environment}-"

  # Environment
  environment = var.environment

  # Tags
  tags = local.common_tags
}

# =============================================================================
# ECS/EKS Module
# =============================================================================
# Container orchestration (ECS or EKS)
# =============================================================================

# Uncomment for ECS
# module "ecs" {
#   source = "./modules/ecs"
# 
#   # Cluster configuration
#   cluster_name = "${local.service_name}-cluster"
#   capacity_providers = ["FARGATE"]
# 
#   # Network
#   vpc_id       = module.network.vpc_id
#   subnet_ids   = module.network.private_subnet_ids
# 
#   # Security
#   security_group_ids = [module.security_groups.ecs_sg_id]
# 
#   # Tags
#   tags = local.common_tags
# }

# Uncomment for EKS
# module "eks" {
#   source = "./modules/eks"
# 
#   # Cluster configuration
#   cluster_name = "${local.service_name}-eks"
#   cluster_version = var.eks_version
# 
#   # Network
#   vpc_id     = module.network.vpc_id
#   subnet_ids = module.network.private_subnet_ids
# 
#   # Control plane
#   enable_managed_node_groups = true
# 
#   # Tags
#   tags = local.common_tags
# }

# =============================================================================
# Outputs
# =============================================================================
# These values are referenced by other configurations
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.network.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.network.vpc_cidr
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.network.private_subnet_ids
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = module.rds.endpoint
}

output "database_arn" {
  description = "Database ARN"
  value       = module.rds.arn
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis.endpoint
}

output "elasticsearch_endpoint" {
  description = "Elasticsearch endpoint"
  value       = module.elasticsearch.endpoint
}

output "s3_bucket_ids" {
  description = "S3 bucket IDs"
  value       = module.s3.bucket_ids
}
