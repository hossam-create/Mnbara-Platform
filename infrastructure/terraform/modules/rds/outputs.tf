# =============================================================================
# Mnbara Platform - RDS Terraform Outputs
# =============================================================================
# Outputs for the RDS module
# =============================================================================

# =============================================================================
# Instance Outputs
# =============================================================================

output "instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "instance_class" {
  description = "Instance class of the RDS instance"
  value       = aws_db_instance.main.instance_class
}

output "endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "hostname" {
  description = "Hostname of the RDS instance"
  value       = split(":", aws_db_instance.main.endpoint)[0]
}

output "port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
}

# =============================================================================
# Database Outputs
# =============================================================================

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "Database username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "password" {
  description = "Database password"
  value       = local.password
  sensitive   = true
}

# =============================================================================
# Connection Outputs
# =============================================================================

output "connection_string" {
  description = "Database connection string"
  value       = "postgresql://${aws_db_instance.main.username}:${local.password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "jdbc_connection_string" {
  description = "JDBC connection string"
  value       = "jdbc:postgresql://${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "arn_suffix" {
  description = "ARN suffix for the instance"
  value       = aws_db_instance.main.arn_suffix
}

output "resource_id" {
  description = "Resource ID for the instance"
  value       = aws_db_instance.main.resource_id
}

# =============================================================================
# Subnet and Security Outputs
# =============================================================================

output "subnet_group_id" {
  description = "ID of the subnet group"
  value       = aws_db_subnet_group.main.id
}

output "subnet_group_name" {
  description = "Name of the subnet group"
  value       = aws_db_subnet_group.main.name
}

output "parameter_group_id" {
  description = "ID of the parameter group"
  value       = aws_db_parameter_group.main.id
}

output "parameter_group_name" {
  description = "Name of the parameter group"
  value       = aws_db_parameter_group.main.name
}

output "security_group_ids" {
  description = "Security group IDs associated with the instance"
  value       = var.security_group_ids
}

# =============================================================================
# Engine Outputs
# =============================================================================

output "engine" {
  description = "Database engine"
  value       = aws_db_instance.main.engine
}

output "engine_version" {
  description = "Database engine version"
  value       = aws_db_instance.main.engine_version
}

output "major_engine_version" {
  description = "Major engine version"
  value       = aws_db_instance.main.major_engine_version
}

# =============================================================================
# Storage Outputs
# =============================================================================

output "allocated_storage" {
  description = "Allocated storage in GB"
  value       = aws_db_instance.main.allocated_storage
}

output "storage_encrypted" {
  description = "Whether storage is encrypted"
  value       = aws_db_instance.main.storage_encrypted
}

# =============================================================================
# Multi-AZ Outputs
# =============================================================================

output "multi_az" {
  description = "Whether Multi-AZ is enabled"
  value       = aws_db_instance.main.multi_az
}

output "availability_zone" {
  description = "Availability zone of the instance"
  value       = aws_db_instance.main.availability_zone
}

# =============================================================================
# Status Outputs
# =============================================================================

output "status" {
  description = "Status of the RDS instance"
  value       = aws_db_instance.main.status
}

output "identifier" {
  description = "Identifier of the RDS instance"
  value       = aws_db_instance.main.identifier
}
