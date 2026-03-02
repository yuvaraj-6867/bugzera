# ─── Network ──────────────────────────────────────────────────────────────────
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# ─── Load Balancer ────────────────────────────────────────────────────────────
output "alb_dns_name" {
  description = "ALB DNS name — point your domain CNAME here"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID (for Route53 alias records)"
  value       = aws_lb.main.zone_id
}

# ─── Database ─────────────────────────────────────────────────────────────────
output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.postgres.port
}

# ─── Redis ────────────────────────────────────────────────────────────────────
output "redis_endpoint" {
  description = "Redis runs as sidecar inside backend task — localhost:6379"
  value       = "redis://localhost:6379/1 (sidecar — no separate cluster)"
}

# ─── ECR ──────────────────────────────────────────────────────────────────────
output "ecr_backend_url" {
  description = "ECR repository URL for backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

# ─── S3 ───────────────────────────────────────────────────────────────────────
output "s3_uploads_bucket" {
  description = "S3 bucket name for file uploads"
  value       = aws_s3_bucket.uploads.bucket
}

# ─── ECS ──────────────────────────────────────────────────────────────────────
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "backend_service_name" {
  description = "ECS backend service name"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "ECS frontend service name"
  value       = aws_ecs_service.frontend.name
}

# ─── Secrets ──────────────────────────────────────────────────────────────────
output "secrets_manager_arn" {
  description = "Secrets Manager ARN for app secrets"
  value       = aws_secretsmanager_secret.app.arn
}

# ─── Quick deploy instructions ────────────────────────────────────────────────
output "next_steps" {
  description = "Post-deploy instructions"
  value       = <<-EOT
    ✅ Infrastructure deployed!

    1. Point DNS:
       Create a CNAME record: app.bugzera.com → ${aws_lb.main.dns_name}

    2. Push Docker images:
       aws ecr get-login-password --region ${var.aws_region} | \
         docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}

       docker build -t ${aws_ecr_repository.backend.repository_url}:latest ./backend
       docker push ${aws_ecr_repository.backend.repository_url}:latest

       docker build -t ${aws_ecr_repository.frontend.repository_url}:latest ./frontend
       docker push ${aws_ecr_repository.frontend.repository_url}:latest

    3. Force ECS service updates:
       aws ecs update-service --cluster ${aws_ecs_cluster.main.name} \
         --service ${aws_ecs_service.backend.name} --force-new-deployment
       aws ecs update-service --cluster ${aws_ecs_cluster.main.name} \
         --service ${aws_ecs_service.frontend.name} --force-new-deployment

    4. Check logs:
       aws logs tail /ecs/${var.app_name}/backend --follow
  EOT
}
