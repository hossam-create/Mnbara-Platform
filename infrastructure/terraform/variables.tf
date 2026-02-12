# =============================================================================
# Mnbara Platform - Terraform Variables
# =============================================================================
# Variables for configuring the Mnbara Platform infrastructure
# =============================================================================

# =============================================================================
# General Configuration
# =============================================================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "mnbara"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team@mnbara.com"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "platform"
}

variable "repository_url" {
  description = "URL of the Git repository"
  type        = string
  default     = "https://github.com/mnbara/platform"
}

# =============================================================================
# VPC Configuration
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default = [
    "10.0.10.0/24",
    "10.0.11.0/24",
    "10.0.12.0/24"
  ]
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

# =============================================================================
# RDS Configuration
# =============================================================================

variable "rds_engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "rds_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "rds_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_db_name" {
  description = "Database name"
  type        = string
  default     = "mnbara"
}

variable "rds_username" {
  description = "Database username"
  type        = string
  default     = "mnbara_admin"
}

variable "rds_password" {
  description = "Database password"
  type        = string
  default     = null # Must be set via tfvars or environment
  sensitive   = true
}

variable "rds_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "rds_backup_retention" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_backup_window" {
  description = "Daily time range for backups"
  type        = string
  default     = "02:00-03:00"
}

variable "rds_maintenance_window" {
  description = "Weekly time range for maintenance"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

# =============================================================================
# ElastiCache (Redis) Configuration
# =============================================================================

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "redis_parameter_group" {
  description = "Redis parameter group name"
  type        = string
  default     = "default.redis7.0"
}

variable "redis_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "redis_transport_encryption" {
  description = "Enable encryption in transit"
  type        = bool
  default     = true
}

# =============================================================================
# Elasticsearch Configuration
# =============================================================================

variable "es_engine_version" {
  description = "Elasticsearch engine version"
  type        = string
  default     = "OpenSearch_2.9"
}

variable "es_instance_type" {
  description = "Elasticsearch instance type"
  type        = string
  default     = "t3.small.elasticsearch"
}

variable "es_instance_count" {
  description = "Number of Elasticsearch instances"
  type        = number
  default     = 1
}

variable "es_master_instance_type" {
  description = "Dedicated master instance type"
  type        = string
  default     = "t3.small.elasticsearch"
}

variable "es_master_instance_count" {
  description = "Number of dedicated master instances"
  type        = number
  default     = 0
}

variable "es_volume_size" {
  description = "EBS volume size in GB"
  type        = number
  default     = 10
}

variable "es_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "es_node_to_node_encryption" {
  description = "Enable node-to-node encryption"
  type        = bool
  default     = true
}

# =============================================================================
# EKS Configuration (Optional)
# =============================================================================

variable "eks_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "eks_node_instance_type" {
  description = "EKS node instance type"
  type        = string
  default     = "t3.medium"
}

variable "eks_desired_capacity" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "eks_max_capacity" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 4
}

variable "eks_min_capacity" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

# =============================================================================
# S3 Configuration
# =============================================================================

variable "s3_bucket_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
}

variable "s3_server_side_encryption" {
  description = "Enable server-side encryption"
  type        = bool
  default     = true
}

variable "s3_lifecycle_rules" {
  description = "S3 lifecycle rules"
  type        = list(map(any))
  default = [
    {
      id      = "archive-old-logs"
      enabled = true
      prefix  = "logs/"
      transition = {
        days          = 90
        storage_class = "STANDARD_IA"
      }
    }
  ]
}
