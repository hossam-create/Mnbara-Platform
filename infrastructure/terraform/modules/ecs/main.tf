# =============================================================================
# Mnbara Platform - ECS Terraform Module
# =============================================================================
# ECS cluster and service configuration for containerized workloads
# =============================================================================

# =============================================================================
# Variables
# =============================================================================
# See variables.tf for variable definitions
# =============================================================================

# =============================================================================
# Local Values
# =============================================================================

locals {
  # Container name (defaults to service name)
  container_name = var.service_name != "" ? var.service_name : "app"
  
  # Container port (defaults to 3000)
  container_port = var.container_port != "" ? var.container_port : 3000
}

# =============================================================================
# ECS Cluster
# =============================================================================
# The ECS cluster that will run the services
# =============================================================================

resource "aws_ecs_cluster" "main" {
  # Cluster name
  name = var.cluster_name

  # Cluster settings
  setting {
    name  = "containerInsights"
    value = var.container_insights ? "enabled" : "disabled"
  }

  # Tags
  tags = merge(var.tags, {
    Name = var.cluster_name
  })
}

# =============================================================================
# ECS Task Definition
# =============================================================================
# Task definition for the service
# =============================================================================

resource "aws_ecs_task_definition" "main" {
  # Task definition family
  family = var.task_family != "" ? var.task_family : "${var.service_name}-task"

  # Task execution role (use existing or create new)
  execution_role_arn = var.task_execution_role_arn != "" ? var.task_execution_role_arn : aws_ecs_task_execution_role.main.arn

  # Task role (for service-to-service calls)
  task_role_arn = var.task_role_arn

  # Network mode (awsvpc required for Fargate)
  network_mode = "awsvpc"

  # Requires compatibility
  requires_compatibilities = ["FARGATE"]

  # CPU and memory
  cpu    = var.task_cpu
  memory = var.task_memory

  # Runtime platform
  runtime_platform {
    operating_system_family = "Linux"
    cpu_architecture        = var.cpu_architecture
  }

  # Container definition
  container_definitions = jsonencode([
    {
      name      = local.container_name
      image     = var.container_image
      cpu       = var.container_cpu
      memory    = var.container_memory
      essential = true

      # Port mappings
      portMappings = [
        {
          containerPort = local.container_port
          protocol      = "tcp"
        }
      ]

      # Environment variables
      environment = var.environment_variables

      # Secrets (from Parameter Store or Secrets Manager)
      secrets = var.secrets

      # Log configuration
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.main.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = var.service_name
        }
      }

      # Health check
      healthCheck = {
        command     = ["CMD-SHELL", "wget --spider -q localhost:${local.container_port}/health || exit 1"]
        interval    = var.health_check_interval
        timeout     = var.health_check_timeout
        retries     = var.health_check_retries
        startPeriod = var.health_check_start_period
      }

      # Resource requirements
      resourceRequirements = [
        {
          type  = "VCPU"
          value = var.container_cpu
        },
        {
          type  = "MEMORY"
          value = var.container_memory
        }
      ]

      # Ulimits (if needed)
      # ulimits = [
      #   {
      #     name      = "nofile"
      #     softLimit = 65536
      #     hardLimit = 65536
      #   }
      # ]
    }
  ])

  # Tags
  tags = var.tags
}

# =============================================================================
# ECS Task Execution Role
# =============================================================================
# IAM role for ECS task execution (pull images, send logs, etc.)
# =============================================================================

resource "aws_iam_role" "task_execution_role" {
  count = var.task_execution_role_arn == "" ? 1 : 0

  name = "${var.cluster_name}-task-execution-role"

  # Use the AWS managed policy for ECS task execution
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "task_execution_policy" {
  count = var.task_execution_role_arn == "" ? 1 : 0

  role       = aws_iam_role.task_execution_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# =============================================================================
# ECS Service
# =============================================================================
# The ECS service that manages the task definition
# =============================================================================

resource "aws_ecs_service" "main" {
  # Service name
  name            = var.service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn

  # Desired count
  desired_count = var.desired_count

  # Launch type
  launch_type = "FARGATE"

  # Scheduling strategy
  scheduling_strategy = var.scheduling_strategy

  # Deployment configuration
  deployment_configuration {
    maximum_percent         = var.maximum_percent
    minimum_healthy_percent = var.minimum_healthy_percent
    deployment_circuit_breaker {
      enable   = var.enable_circuit_breaker
      rollback = var.rollback_on_failure
    }
  }

  # Network configuration
  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = var.assign_public_ip
  }

  # Load balancer configuration
  dynamic "load_balancer" {
    for_each = var.load_balancer_enabled ? [1] : []
    content {
      target_group_arn = var.target_group_arn
      container_name   = local.container_name
      container_port    = local.container_port
    }
  }

  # Service discovery (optional)
  # service_registries {
  #   registry_arn = aws_service_discovery_service.main.arn
  # }

  # Tags
  tags = merge(var.tags, {
    Name = var.service_name
  })

  # Depends on
  depends_on = [
    aws_ecs_task_definition.main,
    aws_cloudwatch_log_group.main
  ]
}

# =============================================================================
# CloudWatch Log Group
# =============================================================================
# Log group for container logs
# =============================================================================

resource "aws_cloudwatch_log_group" "main" {
  name              = "/ecs/${var.service_name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.service_name}-log-group"
  })
}

# =============================================================================
# Outputs
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

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.main.arn
}

output "task_definition_family" {
  description = "Family of the task definition"
  value       = aws_ecs_task_definition.main.family
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "service_arn" {
  description = "ARN of the ECS service"
  value       = aws_ecs_service.main.arn
}

output "task_execution_role_arn" {
  description = "ARN of the task execution role"
  value       = var.task_execution_role_arn != "" ? var.task_execution_role_arn : aws_iam_role.task_execution_role[0].arn
}

output "task_role_arn" {
  description = "ARN of the task role"
  value       = var.task_role_arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.main.name
}
