# =============================================================================
# Mnbara Platform - RDS Terraform Module
# =============================================================================
# PostgreSQL database configuration using AWS RDS
# =============================================================================

# =============================================================================
# Local Values
# =============================================================================

locals {
  # Create a random password if not provided
  password = var.password != null ? var.password : random_password.db_password[0].result
}

# =============================================================================
# Random Password
# =============================================================================

resource "random_password" "db_password" {
  count = var.password != null ? 0 : 1

  length  = 32
  special = false
  upper   = true
  numeric = true
}

# =============================================================================
# RDS Subnet Group
# =============================================================================
# Database subnet group for multi-AZ deployment
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids

  # Tags
  tags = merge(var.tags, {
    Name = "${var.identifier}-subnet-group"
  })
}

# =============================================================================
# RDS Parameter Group
# =============================================================================
# Database parameter group for custom settings
# =============================================================================

resource "aws_db_parameter_group" "main" {
  name        = "${var.identifier}-parameter-group"
  family      = var.family
  description = "Parameter group for ${var.identifier}"

  # Custom parameters
  dynamic "parameter" {
    for_each = var.custom_parameters
    content {
      name  = parameter.key
      value = parameter.value
    }
  }

  # Tags
  tags = merge(var.tags, {
    Name = "${var.identifier}-parameter-group"
  })
}

# =============================================================================
# RDS Instance
# =============================================================================
# PostgreSQL database instance
# =============================================================================

resource "aws_db_instance" "main" {
  # Identifier
  identifier = var.identifier

  # Engine configuration
  engine              = var.engine
  engine_version      = var.engine_version
  instance_class      = var.instance_class
  multi_az            = var.multi_az
  availability_zone   = var.availability_zone
  ca_cert_identifier  = var.ca_cert_identifier

  # Database name and credentials
  db_name  = var.db_name
  username = var.username
  password = local.password
  port     = var.port

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type         = var.storage_type
  storage_encrypted    = var.storage_encrypted
  kms_key_id           = var.kms_key_id

  # Performance
  iops                  = var.iops
  throughput            = var.throughput
  maintenance_window    = var.maintenance_window
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  skip_final_snapshot   = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? "" : "${var.identifier}-final-snapshot"

  # Monitoring
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_role_arn

  # Network configuration
  vpc_security_group_ids = var.security_group_ids
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Options
  publicly_accessible = var.publicly_accessible
  allow_major_version_upgrade = var.allow_major_version_upgrade

  # Deletion protection (enabled in prod)
  deletion_protection = var.deletion_protection

  # Copy tags to snapshot
  copy_tags_to_snapshot = var.copy_tags_to_snapshot

  # Performance insights
  performance_insights_enabled = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_retention_period
  performance_insights_kms_key_id = var.performance_insights_kms_key_id

  # Tags
  tags = merge(var.tags, {
    Name = var.identifier
  })

  # Timeouts
  timeouts {
    create = var.timeouts.create
    delete = var.timeouts.delete
    update = var.timeouts.update
  }
}

# =============================================================================
# RDS Option Group
# =============================================================================
# Database option group (for features like TDE, etc.)
# =============================================================================

resource "aws_db_option_group" "main" {
  count = var.engine == "postgres" ? 0 : 1

  name      = "${var.identifier}-option-group"
  engine_name = var.engine
  major_engine_version = var.major_engine_version

  option {
    option_name = var.option_name
  }

  tags = merge(var.tags, {
    Name = "${var.identifier}-option-group"
  })
}

# =============================================================================
# CloudWatch Alarms
# =============================================================================
# Database monitoring alarms
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description  = "RDS CPU utilization is high"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions
  ok_actions     = var.alarm_actions

  tags = merge(var.tags, {
    Name = "${var.identifier}-cpu-high"
  })
}

resource "aws_cloudwatch_metric_alarm" "storage_low" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 5
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.alarm_storage_threshold
  alarm_description  = "RDS storage space is low"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions
  ok_actions     = var.alarm_actions

  tags = merge(var.tags, {
    Name = "${var.identifier}-storage-low"
  })
}

resource "aws_cloudwatch_metric_alarm" "connections_high" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.alarm_connections_threshold
  alarm_description  = "RDS database connections are high"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions
  ok_actions     = var.alarm_actions

  tags = merge(var.tags, {
    Name = "${var.identifier}-connections-high"
  })
}

# =============================================================================
# Outputs
# =============================================================================

output "instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
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

output "subnet_group_id" {
  description = "ID of the subnet group"
  value       = aws_db_subnet_group.main.id
}

output "parameter_group_id" {
  description = "ID of the parameter group"
  value       = aws_db_parameter_group.main.id
}

output "security_group_ids" {
  description = "Security group IDs"
  value       = var.security_group_ids
}

output "resource_id" {
  description = "Resource ID for the instance"
  value       = aws_db_instance.main.resource_id
}

output "arn_suffix" {
  description = "ARN suffix for the instance"
  value       = aws_db_instance.main.arn_suffix
}
