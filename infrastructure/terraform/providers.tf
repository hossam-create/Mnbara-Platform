# =============================================================================
# Mnbara Platform - Terraform Provider Configuration
# =============================================================================
# Provider configurations for AWS, Kubernetes, and Helm
# =============================================================================

# =============================================================================
# AWS Provider
# =============================================================================
# Amazon Web Services provider for infrastructure resources
# =============================================================================

provider "aws" {
  # Use the specified region
  region = var.aws_region

  # Enable S3 backend (if not using default)
  # s3_use_path_style = false

  # Default tags applied to all resources
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }

  # Assume role for cross-account access (if needed)
  # assume_role {
  #   role_arn     = "arn:aws:iam::${var.target_account_id}:role/${var.role_name}"
  #   session_name = "terraform-session"
  # }

  # Alternative: Use shared credentials file
  # shared_credentials_file = "~/.aws/credentials"
  # profile = "mnbara-terraform"

  # Alternative: Use environment variables
  # AWS_ACCESS_KEY_ID
  # AWS_SECRET_ACCESS_KEY
  # AWS_REGION
}

# =============================================================================
# AWS Provider Alias (Alternate Region)
# =============================================================================
# Use for multi-region deployments
# =============================================================================

# provider "aws" {
#   alias  = "alternate_region"
#   region = var.alternate_aws_region
# 
#   default_tags {
#     tags = {
#       Project     = var.project_name
#       Environment = var.environment
#       ManagedBy   = "terraform"
#     }
#   }
# }

# =============================================================================
# Kubernetes Provider
# =============================================================================
# Kubernetes provider for EKS cluster resources
# Configure after EKS cluster is created
# =============================================================================

provider "kubernetes" {
  # Use the EKS cluster's kubeconfig
  # Configure this after terraform has created the EKS cluster
  
  # Option 1: Use kubeconfig file
  # config_path = "~/.kube/config"
  
  # Option 2: Use eks cluster data (after cluster creation)
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster.cluster.master_ARN
  
  # Option 3: Use kubeconfig with exec (for IAM roles)
  # exec {
  #   api_version = "client.authentication.k8s.io/v1beta1"
  #   command     = "aws-iam-authenticator"
  #   args        = ["token", "-i", var.cluster_name]
  # }
}

# =============================================================================
# Kubernetes Provider Alias (Different Cluster)
# =============================================================================

# provider "kubernetes" {
#   alias = "other_cluster"
#   host  = var.other_cluster_host
#   token = var.other_cluster_token
# }

# =============================================================================
# Helm Provider
# =============================================================================
# Helm provider for installing charts on EKS
# =============================================================================

provider "helm" {
  # Kubernetes configuration
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster.cluster.master_ARN
  }

  # Helm configuration
  # image_pull_secrets = ["regcred"]
}

# =============================================================================
# Data Sources for Provider Configuration
# =============================================================================

# EKS cluster data (used by kubernetes/helm providers)
data "aws_eks_cluster" "cluster" {
  name = var.eks_cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.eks_cluster_name
}

# =============================================================================
# Provider Version Constraints
# =============================================================================
# Define required provider versions
# These are typically specified in the terraform block in main.tf
# =============================================================================

# terraform {
#   required_providers {
#     aws = {
#       source  = "hashicorp/aws"
#       version = "~> 5.0"
#     }
#     kubernetes = {
#       source  = "hashicorp/kubernetes"
#       version = "~> 2.0"
#     }
#     helm = {
#       source  = "hashicorp/helm"
#       version = "~> 2.0"
#     }
#   }
# }

# =============================================================================
# Provider Configuration Notes
# =============================================================================
# 1. AWS Provider: Requires AWS credentials with appropriate permissions
#    - Use IAM roles for EC2 instances
#    - Use AWS CLI profiles for local development
#    - Use environment variables for CI/CD
#
# 2. Kubernetes Provider: Requires access to the EKS cluster
#    - Use aws eks update-kubeconfig to configure kubectl
#    - The provider uses the cluster endpoint and token
#
# 3. Helm Provider: Requires kubectl access to the cluster
#    - Uses the same configuration as Kubernetes provider
#    - Used for installing cluster-level resources
#
# 4. Backend Configuration: Store state in S3 with DynamoDB locking
#    - Configure in terraform block with backend "s3"
# =============================================================================
