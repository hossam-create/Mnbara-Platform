# =============================================================================
# Mnbara Platform - S3 Terraform Variables
# =============================================================================
# Variables for the S3 module
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
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "bucket_prefix" {
  description = "Prefix for bucket names"
  type        = string
  default     = ""
}

# =============================================================================
# Bucket Configuration
# =============================================================================

variable "buckets" {
  description = "List of bucket configurations"
  type = list(object({
    name = string
    type = string  # e.g., "logs", "data", "assets", "backups"
  }))
  default = [
    { name = "data", type = "data" },
    { name = "assets", type = "assets" },
    { name = "backups", type = "backups" },
    { name = "logs", type = "logs" }
  ]
}

variable "bucket_name_override" {
  description = "Override bucket names (use empty string for default)"
  type        = list(string)
  default     = []
}

variable "prevent_destroy" {
  description = "Prevent destruction of buckets"
  type        = bool
  default     = false
}

# =============================================================================
# ACL Configuration
# =============================================================================

variable "acl" {
  description = "ACL for buckets (private, public-read, etc.)"
  type        = string
  default     = ""  # Empty means AWS-managed ACL
}

# =============================================================================
# Versioning Configuration
# =============================================================================

variable "versioning_enabled" {
  description = "Enable versioning"
  type        = bool
  default     = true
}

# =============================================================================
# Server-Side Encryption Configuration
# =============================================================================

variable "server_side_encryption_algorithm" {
  description = "Server-side encryption algorithm"
  type        = string
  default     = "AES256"
}

variable "server_side_encryption_kms_key_id" {
  description = "KMS key ID for encryption (leave empty for S3-managed key)"
  type        = string
  default     = ""
}

variable "bucket_key_enabled" {
  description = "Enable S3 Bucket Key"
  type        = bool
  default     = true
}

# =============================================================================
# Public Access Configuration
# =============================================================================

variable "block_public_acls" {
  description = "Block public ACLs"
  type        = bool
  default     = true
}

variable "block_public_policy" {
  description = "Block public bucket policies"
  type        = bool
  default     = true
}

variable "ignore_public_acls" {
  description = "Ignore public ACLs"
  type        = bool
  default     = true
}

variable "restrict_public_buckets" {
  description = "Restrict public bucket policies"
  type        = bool
  default     = true
}

# =============================================================================
# Bucket Policy
# =============================================================================

variable "bucket_policy" {
  description = "Bucket policy JSON"
  type        = string
  default     = ""
}

# =============================================================================
# Logging Configuration
# =============================================================================

variable "bucket_logging_enabled" {
  description = "Enable bucket logging"
  type        = bool
  default     = false
}

variable "log_bucket_id" {
  description = "ID of the bucket for storing logs"
  type        = string
  default     = ""
}

variable "request_metrics_enabled" {
  description = "Enable request metrics"
  type        = bool
  default     = true
}

# =============================================================================
# Lifecycle Configuration
# =============================================================================

variable "lifecycle_rules_enabled" {
  description = "Enable lifecycle rules"
  type        = bool
  default     = true
}

variable "lifecycle_rule_name" {
  description = "Name of the lifecycle rule"
  type        = string
  default     = "lifecycle-rule"
}

variable "lifecycle_transitions" {
  description = "Lifecycle transition rules"
  type = list(object({
    days          = number
    storage_class = string
  }))
  default = [
    { days = 30, storage_class = "STANDARD_IA" },
    { days = 90, storage_class = "GLACIER" }
  ]
}

variable "lifecycle_expiration_days" {
  description = "Days before objects expire"
  type        = number
  default     = 365
}

variable "lifecycle_noncurrent_version_expiration_days" {
  description = "Days before noncurrent versions expire"
  type        = number
  default     = 90
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
