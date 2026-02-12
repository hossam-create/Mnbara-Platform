# =============================================================================
# Mnbara Platform - ECS Terraform Variables
# =============================================================================
# Variables for the ECS module
# =============================================================================

# =============================================================================
# Cluster Configuration
# =============================================================================

variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
  default     = "mnbara-cluster"
}

variable "container_insights" {
  description = "Enable Container Insights"
  type        = bool
  default     = true
}

# =============================================================================
# Service Configuration
# =============================================================================

variable "service_name" {
  description = "Name of the ECS service"
  type        = string
  default     = "mnbara-service"
}

variable "task_family" {
  description = "Family name for the task definition"
  type        = string
  default     = ""
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "scheduling_strategy" {
  description = "Scheduling strategy (DAEMON or REPLICA)"
  type        = string
  default     = "REPLICA"
}

# =============================================================================
# Task Configuration
# =============================================================================

variable "task_cpu" {
  description = "CPU units for the task (256, 512, 1024, etc.)"
  type        = string
  default     = "512"
}

variable "task_memory" {
  description = "Memory for the task in MiB (512, 1024, 2048, etc.)"
  type        = string
  default     = "1024"
}

variable "container_cpu" {
  description = "CPU units for the container"
  type        = string
  default     = "0"
}

variable "container_memory" {
  description = "Memory for the container in MiB"
  type        = string
  default     = "512"
}

variable "container_port" {
  description = "Port the container listens on"
  type        = string
  default     = "3000"
}

variable "cpu_architecture" {
  description = "CPU architecture (X86_64 or ARM64)"
  type        = string
  default     = "X86_64"
}

# =============================================================================
# Container Image
# =============================================================================

variable "container_image" {
  description = "Docker image URL"
  type        = string
  default     = "mnbara/app:latest"
}

# =============================================================================
# Deployment Configuration
# =============================================================================

variable "maximum_percent" {
  description = "Upper limit for the number of tasks during a deployment"
  type        = number
  default     = 200
}

variable "minimum_healthy_percent" {
  description = "Lower limit for the number of tasks during a deployment"
  type        = number
  default     = 50
}

variable "enable_circuit_breaker" {
  description = "Enable deployment circuit breaker"
  type        = bool
  default     = true
}

variable "rollback_on_failure" {
  description = "Rollback on deployment failure"
  type        = bool
  default     = true
}

# =============================================================================
# Health Check Configuration
# =============================================================================

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "health_check_retries" {
  description = "Number of health check retries"
  type        = number
  default     = 3
}

variable "health_check_start_period" {
  description = "Startup period for health checks in seconds"
  type        = number
  default     = 60
}

# =============================================================================
# Network Configuration
# =============================================================================

variable "subnet_ids" {
  description = "Subnet IDs for the service"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs for the service"
  type        = list(string)
  default     = []
}

variable "assign_public_ip" {
  description = "Assign a public IP to the task"
  type        = bool
  default     = false
}

# =============================================================================
# Load Balancer Configuration
# =============================================================================

variable "load_balancer_enabled" {
  description = "Enable load balancer integration"
  type        = bool
  default     = true
}

variable "target_group_arn" {
  description = "ARN of the target group"
  type        = string
  default     = ""
}

# =============================================================================
# IAM Configuration
# =============================================================================

variable "task_execution_role_arn" {
  description = "ARN of the task execution role (use existing or leave empty to create)"
  type        = string
  default     = ""
}

variable "task_role_arn" {
  description = "ARN of the task role for service-to-service permissions"
  type        = string
  default     = ""
}

# =============================================================================
# Environment and Secrets
# =============================================================================

variable "environment_variables" {
  description = "Environment variables for the container"
  type        = list(map(string))
  default     = []
}

variable "secrets" {
  description = "Secrets for the container (from Parameter Store or Secrets Manager)"
  type        = list(map(string))
  default     = []
}

# =============================================================================
# Logging Configuration
# =============================================================================

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

# =============================================================================
# AWS Configuration
# =============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
