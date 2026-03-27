# =============================================================================
# Mnbara Platform - ECS Terraform Outputs
# =============================================================================
# Outputs for the ECS module
# =============================================================================

# =============================================================================
# Cluster Outputs
# =============================================================================

output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

# =============================================================================
# Task Definition Outputs
# =============================================================================

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.main.arn
}

output "task_definition_family" {
  description = "Family of the task definition"
  value       = aws_ecs_task_definition.main.family
}

output "task_definition_revision" {
  description = "Revision of the task definition"
  value       = aws_ecs_task_definition.main.revision
}

# =============================================================================
# Service Outputs
# =============================================================================

output "service_id" {
  description = "ID of the ECS service"
  value       = aws_ecs_service.main.id
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "service_arn" {
  description = "ARN of the ECS service"
  value       = aws_ecs_service.main.arn
}

output "service_desired_count" {
  description = "Desired count of the service"
  value       = aws_ecs_service.main.desired_count
}

output "service_running_count" {
  description = "Running count of the service"
  value       = aws_ecs_service.main.running_count
}

output "service_pending_count" {
  description = "Pending count of the service"
  value       = aws_ecs_service.main.pending_count
}

# =============================================================================
# IAM Role Outputs
# =============================================================================

output "task_execution_role_arn" {
  description = "ARN of the task execution role"
  value       = var.task_execution_role_arn != "" ? var.task_execution_role_arn : aws_iam_role.task_execution_role[0].arn
}

output "task_execution_role_name" {
  description = "Name of the task execution role"
  value       = var.task_execution_role_arn != "" ? "" : aws_iam_role.task_execution_role[0].name
}

output "task_role_arn" {
  description = "ARN of the task role"
  value       = var.task_role_arn
}

output "task_role_name" {
  description = "Name of the task role"
  value       = var.task_role_arn != "" ? element(split("/", var.task_role_arn), length(split("/", var.task_role_arn)) - 1) : ""
}

# =============================================================================
# CloudWatch Outputs
# =============================================================================

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.main.name
}

output "log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.main.arn
}

# =============================================================================
# Container Outputs
# =============================================================================

output "container_name" {
  description = "Name of the container"
  value       = local.container_name
}

output "container_port" {
  description = "Port the container listens on"
  value       = local.container_port
}

output "task_cpu" {
  description = "CPU units for the task"
  value       = var.task_cpu
}

output "task_memory" {
  description = "Memory for the task in MiB"
  value       = var.task_memory
}

output "container_image" {
  description = "Docker image URL"
  value       = var.container_image
}
