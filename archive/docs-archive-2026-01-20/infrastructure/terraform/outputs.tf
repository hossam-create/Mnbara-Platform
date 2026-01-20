output "vpc_id" {
  value = aws_vpc.main.id
}

output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "s3_bucket_name" {
  value = aws_s3_bucket.images.id
}

output "ecr_auth_repo" {
  value = aws_ecr_repository.auth_service.repository_url
}
