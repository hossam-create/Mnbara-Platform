# =============================================================================
# Mnbara Platform - S3 Terraform Module
# =============================================================================
# S3 bucket configuration for storage needs
# =============================================================================

# =============================================================================
# Local Values
# =============================================================================

locals {
  # Create unique bucket names
  bucket_name_prefix = var.bucket_prefix != "" ? var.bucket_prefix : "${var.environment}-${var.project_name}-"
  
  # All bucket names
  bucket_names = [
    for i, bucket in var.buckets : 
    var.bucket_name_override[i] != "" ? var.bucket_name_override[i] : 
    "${local.bucket_name_prefix}${bucket.name}"
  ]
}

# =============================================================================
# S3 Buckets
# =============================================================================
# Create multiple S3 buckets based on configuration
# =============================================================================

resource "aws_s3_bucket" "main" {
  for_each = toset(var.bucket_names)

  bucket = each.value

  # Lifecycle configuration
  lifecycle {
    create_before_destroy = true
    prevent_destroy        = var.prevent_destroy
  }

  # Tags
  tags = merge(var.tags, {
    Name        = each.value
    Environment = var.environment
    BucketType  = lookup(element(var.buckets, index(var.bucket_names, each.value)), "type", "general")
  })
}

# =============================================================================
# S3 Bucket Versioning
# =============================================================================

resource "aws_s3_bucket_versioning" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }

  depends_on = [aws_s3_bucket.main]
}

# =============================================================================
# S3 Bucket Server-Side Encryption
# =============================================================================

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.server_side_encryption_algorithm
      kms_master_key_id = var.server_side_encryption_kms_key_id != "" ? var.server_side_encryption_kms_key_id : null
    }

    bucket_key_enabled = var.bucket_key_enabled
  }
}

# =============================================================================
# S3 Bucket Public Access Block
# =============================================================================

resource "aws_s3_bucket_public_access_block" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  block_public_acls       = var.block_public_acls
  block_public_policy     = var.block_public_policy
  ignore_public_acls      = var.ignore_public_acls
  restrict_public_buckets = var.restrict_public_buckets
}

# =============================================================================
# S3 Bucket ACL (Optional)
# =============================================================================

resource "aws_s3_bucket_acl" "main" {
  count = var.acl != "" ? length(aws_s3_bucket.main) : 0

  bucket = tolist(aws_s3_bucket.main)[count.index].id
  acl    = var.acl
}

# =============================================================================
# S3 Bucket Lifecycle Rules
# =============================================================================

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    id     = var.lifecycle_rule_name
    status = var.lifecycle_rules_enabled ? "Enabled" : "Disabled"

    # Transition to different storage classes
    dynamic "transition" {
      for_each = var.lifecycle_transitions
      content {
        days          = transition.value.days
        storage_class = transition.value.storage_class
      }
    }

    # Expiration
    dynamic "expiration" {
      for_each = var.lifecycle_expiration_days > 0 ? [1] : []
      content {
        days = var.lifecycle_expiration_days
      }
    }

    # Noncurrent version expiration
    dynamic "noncurrent_version_expiration" {
      for_each = var.lifecycle_noncurrent_version_expiration_days > 0 ? [1] : []
      content {
        noncurrent_days = var.lifecycle_noncurrent_version_expiration_days
      }
    }
  }
}

# =============================================================================
# S3 Bucket Logging
# =============================================================================

resource "aws_s3_bucket_logging" "main" {
  for_each = var.bucket_logging_enabled && var.log_bucket_id != "" ? aws_s3_bucket.main : {}

  bucket = each.value.id

  target_bucket = var.log_bucket_id
  target_prefix = "${each.value.bucket}/"
}

# =============================================================================
# S3 Bucket Policy (Optional)
# =============================================================================

resource "aws_s3_bucket_policy" "main" {
  for_each = var.bucket_policy != "" ? aws_s3_bucket.main : {}

  bucket = each.value.id
  policy = var.bucket_policy
}

# =============================================================================
# CloudWatch Metrics
# =============================================================================

resource "aws_s3_bucket_metric" "requests" {
  for_each = var.request_metrics_enabled ? aws_s3_bucket.main : {}

  bucket = each.value.id
  name   = "${each.value.bucket}-requests"
}

# =============================================================================
# Outputs
# =============================================================================

output "bucket_ids" {
  description = "List of bucket IDs"
  value       = [for bucket in aws_s3_bucket.main : bucket.id]
}

output "bucket_arns" {
  description = "List of bucket ARNs"
  value       = [for bucket in aws_s3_bucket.main : bucket.arn]
}

output "bucket_names" {
  description = "List of bucket names"
  value       = [for bucket in aws_s3_bucket.main : bucket.bucket]
}

output "bucket_id" {
  description = "ID of the first bucket (for single bucket use)"
  value       = length(aws_s3_bucket.main) > 0 ? tolist(aws_s3_bucket.main)[0].id : ""
}

output "bucket_arn" {
  description = "ARN of the first bucket (for single bucket use)"
  value       = length(aws_s3_bucket.main) > 0 ? tolist(aws_s3_bucket.main)[0].arn : ""
}

output "bucket_name" {
  description = "Name of the first bucket (for single bucket use)"
  value       = length(aws_s3_bucket.main) > 0 ? tolist(aws_s3_bucket.main)[0].bucket : ""
}

output "logs_bucket_id" {
  description = "ID of the logs bucket"
  value       = var.log_bucket_id != "" ? var.log_bucket_id : ""
}
