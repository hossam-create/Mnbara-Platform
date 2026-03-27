# =============================================================================
# Mnbara Platform - Terraform Outputs
# =============================================================================
# These outputs are used to reference infrastructure resources
# =============================================================================

# =============================================================================
# Network Outputs
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = module.network.vpc_arn
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.network.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.network.private_subnet_ids
}

output "public_subnet_arns" {
  description = "List of public subnet ARNs"
  value       = module.network.public_subnet_arns
}

output "private_subnet_arns" {
  description = "List of private subnet ARNs"
  value       = module.network.private_subnet_arns
}

output "nat_gateway_ids" {
  description = "List of NAT gateway IDs"
  value       = module.network.nat_gateway_ids
}

output "nat_gateway_eip_allocation_ids" {
  description = "List of NAT gateway EIP allocation IDs"
  value       = module.network.nat_gateway_eip_allocation_ids
}

output "internet_gateway_id" {
  description = "ID of the internet gateway"
  value       = module.network.internet_gateway_id
}

# =============================================================================
# Security Group Outputs
# =============================================================================

output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = module.security_groups.rds_sg_id
}

output "redis_security_group_id" {
  description = "Security group ID for ElastiCache"
  value       = module.security_groups.redis_sg_id
}

output "elasticsearch_security_group_id" {
  description = "Security group ID for Elasticsearch"
  value       = module.security_groups.elasticsearch_sg_id
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS/EKS"
  value       = module.security_groups.ecs_sg_id
}

output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = module.security_groups.alb_sg_id
}

# =============================================================================
# RDS Outputs
# =============================================================================

output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = module.rds.instance_id
}

output "rds_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = module.rds.endpoint
}

output "rds_instance_arn" {
  description = "ARN of the RDS instance"
  value       = module.rds.arn
}

output "rds_instance_hostname" {
  description = "Hostname of the RDS instance"
  value       = module.rds.hostname
}

output "rds_database_name" {
  description = "Name of the database"
  value       = module.rds.db_name
}

output "rds_database_username" {
  description = "Username for the database"
  value       = module.rds.username
  sensitive   = true
}

output "rds_database_password" {
  description = "Password for the database"
  value       = module.rds.password
  sensitive   = true
}

output "rds_subnet_group_id" {
  description = "ID of the RDS subnet group"
  value       = module.rds.subnet_group_id
}

output "rds_parameter_group_id" {
  description = "ID of the RDS parameter group"
  value       = module.rds.parameter_group_id
}

# =============================================================================
# ElastiCache (Redis) Outputs
# =============================================================================

output "redis_cluster_id" {
  description = "ID of the ElastiCache cluster"
  value       = module.redis.cluster_id
}

output "redis_cluster_endpoint" {
  description = "Endpoint of the ElastiCache cluster"
  value       = module.redis.endpoint
}

output "redis_cluster_arn" {
  description = "ARN of the ElastiCache cluster"
  value       = module.redis.arn
}

output "redis_host" {
  description = "Host of the Redis cluster"
  value       = module.redis.host
}

output "redis_port" {
  description = "Port of the Redis cluster"
  value       = module.redis.port
  sensitive   = true
}

output "redis_parameter_group_id" {
  description = "ID of the Redis parameter group"
  value       = module.redis.parameter_group_id
}

output "redis_subnet_group_id" {
  description = "ID of the ElastiCache subnet group"
  value       = module.redis.subnet_group_id
}

output "redis_replication_group_id" {
  description = "ID of the replication group (if multi-AZ)"
  value       = module.redis.replication_group_id
}

# =============================================================================
# Elasticsearch Outputs
# =============================================================================

output "elasticsearch_domain_id" {
  description = "ID of the Elasticsearch domain"
  value       = module.elasticsearch.domain_id
}

output "elasticsearch_domain_arn" {
  description = "ARN of the Elasticsearch domain"
  value       = module.elasticsearch.domain_arn
}

output "elasticsearch_endpoint" {
  description = "Endpoint of the Elasticsearch domain"
  value       = module.elasticsearch.endpoint
}

output "elasticsearch_kibana_endpoint" {
  description = "Kibana endpoint of the Elasticsearch domain"
  value       = module.elasticsearch.kibana_endpoint
}

# =============================================================================
# S3 Outputs
# =============================================================================

output "s3_bucket_ids" {
  description = "List of S3 bucket IDs"
  value       = module.s3.bucket_ids
}

output "s3_bucket_arns" {
  description = "List of S3 bucket ARNs"
  value       = module.s3.bucket_arns
}

output "s3_bucket_names" {
  description = "List of S3 bucket names"
  value       = module.s3.bucket_names
}

output "s3_logs_bucket_id" {
  description = "ID of the S3 bucket for logs"
  value       = module.s3.logs_bucket_id
}

# =============================================================================
# ECS/EKS Outputs
# =============================================================================

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = module.ecs.cluster_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = module.ecs.cluster_arn
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = module.ecs.task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = module.ecs.task_role_arn
}

output "ecs_service_role_arn" {
  description = "ARN of the ECS service role"
  value       = module.ecs.service_role_arn
}

# EKS Outputs
output "eks_cluster_id" {
  description = "ID of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = module.eks.cluster_arn
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_ca_data" {
  description = "CA certificate data for EKS cluster"
  value       = module.eks.cluster_ca_data
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OIDC provider"
  value       = module.eks.oidc_provider_arn
}

output "eks_node_role_arn" {
  description = "ARN of the EKS node role"
  value       = module.eks.node_role_arn
}

output "eks_node_security_group_id" {
  description = "ID of the EKS node security group"
  value       = module.eks.node_security_group_id
}

output "eks_workers_security_group_id" {
  description = "ID of the workers security group"
  value       = module.eks.workers_security_group_id
}

# =============================================================================
# Application Load Balancer Outputs
# =============================================================================

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the ALB"
  value       = module.alb.alb_zone_id
}

output "alb_arn" {
  description = "ARN of the ALB"
  value       = module.alb.alb_arn
}

output "alb_arn_suffix" {
  description = "ARN suffix of the ALB"
  value       = module.alb.alb_arn_suffix
}

output "alb_http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = module.alb.http_listener_arn
}

output "alb_https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = module.alb.https_listener_arn
}

output "alb_target_group_arns" {
  description = "ARNs of the target groups"
  value       = module.alb.target_group_arns
}

# =============================================================================
# CloudWatch Outputs
# =============================================================================

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = module.cloudwatch.log_group_name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = module.cloudwatch.log_group_arn
}
