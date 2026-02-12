# =============================================================================
# Mnbara Platform - S3 Terraform Outputs
# =============================================================================
# Outputs for the S3 module
# =============================================================================

# =============================================================================
# Bucket Outputs
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

output "logs_bucket_arn" {
  description = "ARN of the logs bucket"
  value       = var.log_bucket_id != "" ? var.log_bucket_id : ""
}

# =============================================================================
# Domain Name Outputs (for website hosting)
# =============================================================================

output "bucket_regional_domain_name" {
  description = "Regional domain name of the first bucket"
  value       = length(aws_s3_bucket.main) > 0 ? tolist(aws_s3_bucket.main)[0].bucket_regional_domain_name : ""
}

output "bucket_regional_domain_names" {
  description = "Regional domain names for all buckets"
  value       = [for bucket in aws_s3_bucket.main : bucket.bucket_regional_domain_name]
}

# =============================================================================
# Website Hosting Outputs
# =============================================================================

output "bucket_website_endpoint" {
  description = "Website endpoint of the first bucket"
  value       = length(aws_s3_bucket.main) > 0 ? tolist(aws_s3_bucket.main)[0].website_endpoint : ""
}

output "bucket_website_domain" {
  description = "Website domain of the first bucket"
  value       = length(aws_s3_bucket.main) > 0 ? tolist(aws_s3_bucket.main)[0].website_domain : ""
}

# =============================================================================
# Versioning Outputs
# =============================================================================

output "bucket_versioning_id" {
  description = "ID of the versioning configuration"
  value       = length(aws_s3_bucket_versioning.main) > 0 ? tolist(aws_s3_bucket_versioning.main)[0].id : ""
}

# =============================================================================
# Encryption Outputs
# =============================================================================

output "bucket_server_side_encryption_configuration_id" {
  description = "ID of the server-side encryption configuration"
  value       = length(aws_s3_bucket_server_side_encryption_configuration.main) > 0 ? tolist(aws_s3_bucket_server_side_encryption_configuration.main)[0].id : ""
}

# =============================================================================
# Public Access Block Outputs
# =============================================================================

output "bucket_public_access_block_id" {
  description = "ID of the public access block configuration"
  value       = length(aws_s3_bucket_public_access_block.main) > 0 ? tolist(aws_s3_bucket_public_access_block.main)[0].id : ""
}
