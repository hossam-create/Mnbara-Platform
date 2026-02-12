# =============================================================================
# Mnbara Platform - RDS Terraform Variables
# =============================================================================
# Variables for the RDS module
# =============================================================================

# =============================================================================
# Naming and Identification
# =============================================================================

variable "identifier" {
  description = "Unique identifier for the RDS instance"
  type        = string
  default     = "mnbara-db"
}

# =============================================================================
# Engine Configuration
# =============================================================================

variable "engine" {
  description = "Database engine (postgres, mysql, etc.)"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "family" {
  description = "Parameter group family (e.g., postgres15)"
  type        = string
  default     = "postgres15"
}

variable "major_engine_version" {
  description = "Major version for option group"
  type        = string
  default     = "15"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# =============================================================================
# Multi-AZ Configuration
# =============================================================================

variable "multi_az" {
  description = "Enable multi-AZ deployment"
  type        = bool
  default     = false
}

variable "availability_zone" {
  description = "Availability zone for single-AZ deployment"
  type        = string
  default     = null
}

# =============================================================================
# Database Credentials
# =============================================================================

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "mnbara"
}

variable "username" {
  description = "Database username"
  type        = string
  default     = "admin"
}

variable "password" {
  description = "Database password (leave null to generate random)"
  type        = string
  default     = null
  sensitive   = true
}

variable "port" {
  description = "Database port"
  type        = number
  default     = 5432
}

# =============================================================================
# Storage Configuration
# =============================================================================

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum storage allocation in GB"
  type        = number
  default     = 100
}

variable "storage_type" {
  description = "Storage type (gp2, gp3, io1)"
  type        = string
  default     = "gp2"
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

variable "iops" {
  description = "IOPS for gp3 or io1 storage"
  type        = number
  default     = null
}

variable "throughput" {
  description = "Throughput for gp3 storage in MB/s"
  type        = number
  default     = null
}

# =============================================================================
# Backup Configuration
# =============================================================================

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Daily time range for backups"
  type        = string
  default     = "02:00-03:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

# =============================================================================
# Maintenance Configuration
# =============================================================================

variable "maintenance_window" {
  description = "Weekly time range for maintenance"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "allow_major_version_upgrade" {
  description = "Allow major version upgrades"
  type        = bool
  default     = false
}

# =============================================================================
# Monitoring Configuration
# =============================================================================

variable "monitoring_interval" {
  description = "Enhanced monitoring interval in seconds"
  type        = number
  default     = 0
}

variable "monitoring_role_arn" {
  description = "ARN of the IAM role for Enhanced Monitoring"
  type        = string
  default     = null
}

# =============================================================================
# Network Configuration
# =============================================================================

variable "subnet_ids" {
  description = "Subnet IDs for the database subnet group"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs to associate with the instance"
  type        = list(string)
  default     = []
}

variable "publicly_accessible" {
  description = "Make the instance publicly accessible"
  type        = bool
  default     = false
}

variable "ca_cert_identifier" {
  description = "CA certificate identifier"
  type        = string
  default     = "rds-ca-rsa2048-g1"
}

# =============================================================================
# Security Configuration
# =============================================================================

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "copy_tags_to_snapshot" {
  description = "Copy tags to snapshots"
  type        = bool
  default     = true
}

# =============================================================================
# Performance Insights
# =============================================================================

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = false
}

variable "performance_insights_retention_period" {
  description = "Performance Insights retention period in days"
  type        = number
  default     = 7
}

variable "performance_insights_kms_key_id" {
  description = "KMS key ID for Performance Insights"
  type        = string
  default     = null
}

# =============================================================================
# Custom Parameters
# =============================================================================

variable "custom_parameters" {
  description = "Custom parameters for the parameter group"
  type        = map(string)
  default     = {}
}

# =============================================================================
# Option Group
# =============================================================================

variable "option_name" {
  description = "Option group name"
  type        = string
  default     = ""
}

# =============================================================================
# Alarms
# =============================================================================

variable "create_alarms" {
  description = "Create CloudWatch alarms"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "ARNs of alarm actions"
  type        = list(string)
  default     = []
}

variable "alarm_cpu_threshold" {
  description = "CPU utilization alarm threshold"
  type        = number
  default     = 80
}

variable "alarm_storage_threshold" {
  description = "Free storage alarm threshold in bytes"
  type        = number
  default     = 1073741824  # 1GB
}

variable "alarm_connections_threshold" {
  description = "Database connections alarm threshold"
  type        = number
  default     = 80
}

# =============================================================================
# Timeouts
# =============================================================================

variable "timeouts" {
  description = "Timeouts for RDS operations"
  type        = object({
    create = string
    delete = string
    update = string
  })
  default = {
    create = "40m"
    delete = "40m"
    update = "80m"
  }
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
