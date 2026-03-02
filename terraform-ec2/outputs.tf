# ─── Outputs ──────────────────────────────────────────────────────────────────
output "elastic_ip" {
  description = "Fixed public IP of your server (update DNS here)"
  value       = aws_eip.app.public_ip
}

output "app_url" {
  description = "App URL — open in browser after deploy"
  value       = "http://${aws_eip.app.public_ip}"
}

output "ssh_command" {
  description = "SSH into your server"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_eip.app.public_ip}"
}

output "s3_bucket" {
  description = "S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "ecr_backend_url" {
  description = "ECR URL — use for backend_image in tfvars"
  value       = "${aws_ecr_repository.backend.repository_url}:latest"
}

output "ecr_frontend_url" {
  description = "ECR URL — use for frontend_image in tfvars"
  value       = "${aws_ecr_repository.frontend.repository_url}:latest"
}

output "setup_log" {
  description = "Watch setup progress on the server"
  value       = "ssh ec2-user@${aws_eip.app.public_ip} 'tail -f /var/log/bugzera-setup.log'"
}

output "monthly_cost_estimate" {
  description = "Estimated monthly AWS cost"
  value = join("\n", [
    "─────────────────────────────────────",
    "t2.micro  (free tier): $0/month (12 months)",
    "t2.micro  (after free): ~$9/month",
    "t3.micro              : ~$8.5/month",
    "EBS 20 GB gp3         : $1.60/month (free tier: $0)",
    "Elastic IP (attached) : $0/month",
    "S3 uploads            : ~$0.50/month",
    "ECR storage           : ~$0 (500 MB free)",
    "─────────────────────────────────────",
    "TOTAL (free tier)     : ~$0/month   ✓",
    "TOTAL (after free)    : ~$10-11/month ✓",
    "─────────────────────────────────────",
  ])
}

output "next_steps" {
  description = "What to do after terraform apply"
  value = <<-STEPS
    ─── After first apply ──────────────────────────────────────────────
    1. Build & push Docker images:

       # Backend
       cd backend
       docker build -f Dockerfile.prod -t ${aws_ecr_repository.backend.repository_url}:latest .
       aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}
       docker push ${aws_ecr_repository.backend.repository_url}:latest

       # Frontend
       cd ../frontend
       docker build -f Dockerfile.prod -t ${aws_ecr_repository.frontend.repository_url}:latest .
       docker push ${aws_ecr_repository.frontend.repository_url}:latest

    2. Set image URLs in terraform.tfvars:
       backend_image  = "${aws_ecr_repository.backend.repository_url}:latest"
       frontend_image = "${aws_ecr_repository.frontend.repository_url}:latest"

    3. Re-apply Terraform:
       terraform apply

    4. Update FRONTEND_URL in .env if needed:
       ssh ec2-user@${aws_eip.app.public_ip}
       nano /opt/bugzera/.env   # update FRONTEND_URL + GOOGLE_REDIRECT_URI
       cd /opt/bugzera && docker compose restart backend sidekiq

    5. (Optional) Add HTTPS with Let's Encrypt:
       ssh ec2-user@${aws_eip.app.public_ip}
       sudo dnf install -y certbot python3-certbot-nginx
       sudo certbot --nginx -d yourdomain.com
    ──────────────────────────────────────────────────────────────────
  STEPS
}
