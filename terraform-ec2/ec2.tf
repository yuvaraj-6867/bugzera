# ─── Locals ────────────────────────────────────────────────────────────────────
locals {
  frontend_url = var.domain_or_ip != "" ? "https://${var.domain_or_ip}" : "http://SET_AFTER_DEPLOY"
}

# ─── S3 bucket for file uploads (~$0.50/month for small usage) ────────────────
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.app_name}-uploads-${random_id.suffix.hex}"
  tags   = { Name = "${var.app_name}-uploads" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket     = aws_s3_bucket.uploads.id
  depends_on = [aws_s3_bucket_server_side_encryption_configuration.uploads]
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# ─── ECR repos (free 500 MB/month) ────────────────────────────────────────────
resource "aws_ecr_repository" "backend" {
  name                 = "${var.app_name}/backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = { Name = "${var.app_name}-backend-ecr" }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.app_name}/frontend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = { Name = "${var.app_name}-frontend-ecr" }
}

# ─── IAM Role for EC2 (S3 + ECR access) ──────────────────────────────────────
resource "aws_iam_role" "ec2" {
  name = "${var.app_name}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ec2_s3" {
  name = "${var.app_name}-s3"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"]
      Resource = [aws_s3_bucket.uploads.arn, "${aws_s3_bucket.uploads.arn}/*"]
    }]
  })
}

resource "aws_iam_role_policy" "ec2_ecr" {
  name = "${var.app_name}-ecr"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchCheckLayerAvailability"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.app_name}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# ─── SSH Key Pair ─────────────────────────────────────────────────────────────
resource "aws_key_pair" "app" {
  key_name   = "${var.app_name}-key"
  public_key = var.your_ssh_public_key
}

# ─── AMI — Amazon Linux 2023 x86_64 (latest) ─────────────────────────────────
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ─── EC2 Instance ─────────────────────────────────────────────────────────────
resource "aws_instance" "app" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.app.key_name
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size           = 30      # 30 GB gp3 (AMI requires ≥30 GB; free tier includes 30 GB)
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  # ── Startup script ──────────────────────────────────────────────────────────
  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    backend_image        = var.backend_image != "" ? var.backend_image : aws_ecr_repository.backend.repository_url
    frontend_image       = var.frontend_image != "" ? var.frontend_image : aws_ecr_repository.frontend.repository_url
    secret_key_base      = var.secret_key_base
    google_client_id     = var.google_client_id
    google_client_secret = var.google_client_secret
    aws_region           = var.aws_region
    s3_bucket            = aws_s3_bucket.uploads.bucket
    frontend_url         = local.frontend_url
  }))

  tags = { Name = "${var.app_name}-server" }
}
