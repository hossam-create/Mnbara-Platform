resource "aws_s3_bucket" "images" {
  bucket = "${var.project_name}-images-${var.environment}"

  tags = {
    Name        = "Mnbara Images"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_ownership_controls" "images" {
  bucket = aws_s3_bucket.images.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "images" {
  depends_on = [
    aws_s3_bucket_ownership_controls.images,
    aws_s3_bucket_public_access_block.images,
  ]

  bucket = aws_s3_bucket.images.id
  acl    = "public-read"
}
