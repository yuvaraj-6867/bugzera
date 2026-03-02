variable "aws_region"   { default = "ap-south-1" }
variable "app_name"     { default = "bugzera" }

# ── Instance size ─────────────────────────────────────────────────────────────
# t2.micro  → FREE (AWS Free Tier, first 12 months)  — 1 vCPU, 1 GB RAM
# t3.micro  → ~$8.5/month after free tier             — 1 vCPU, 1 GB RAM
# t3.small  → ~$15/month                              — 2 vCPU, 2 GB RAM (more headroom)
variable "instance_type" { default = "t2.micro" }

# ── Secrets (set in terraform.tfvars — never commit that file) ────────────────
variable "secret_key_base"      { sensitive = true }
variable "google_client_id" {
  sensitive = true
  default   = ""
}
variable "google_client_secret" {
  sensitive = true
  default   = ""
}
variable "your_ssh_public_key"  { description = "Paste ~/.ssh/id_rsa.pub here" }

# ── Optional domain (leave blank to use Elastic IP) ───────────────────────────
variable "domain_or_ip" { default = "" }

# ── Docker images from ECR (fill after first push) ───────────────────────────
# Leave blank on first apply — Terraform creates ECR repos and prints the URLs.
# Push images, then re-apply with these filled.
variable "backend_image"  { default = "" }
variable "frontend_image" { default = "" }
