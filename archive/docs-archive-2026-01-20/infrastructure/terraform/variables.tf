variable "aws_region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project Name"
  default     = "mnbara"
}

variable "environment" {
  description = "Environment (dev/prod)"
  default     = "production"
}

variable "db_password" {
  description = "Database Password"
  sensitive   = true
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}
