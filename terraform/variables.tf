variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-south-1" # Mumbai — closest to IST
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "bugzera"
}

# ─── Networking ───────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to use (at least 2)"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ─── ECS / Containers ─────────────────────────────────────────────────────────
variable "backend_image" {
  description = "Docker image URI for Rails backend (ECR URI)"
  type        = string
  default     = "" # Filled by CI/CD after docker push
}

variable "frontend_image" {
  description = "Docker image URI for React frontend (ECR URI)"
  type        = string
  default     = ""
}

variable "backend_cpu" {
  description = "CPU units for backend task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory (MB) for backend task"
  type        = number
  default     = 1024
}

variable "sidekiq_cpu" {
  description = "CPU units for Sidekiq task"
  type        = number
  default     = 256
}

variable "sidekiq_memory" {
  description = "Memory (MB) for Sidekiq task"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MB) for frontend task"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Number of backend task instances (1 = cost-optimized)"
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  description = "Number of frontend task instances"
  type        = number
  default     = 1
}

# ─── Database ─────────────────────────────────────────────────────────────────
variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "bugzera_production"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "bugzera"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB"
  type        = number
  default     = 20
}

# ─── Redis / ElastiCache ──────────────────────────────────────────────────────
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

# ─── App Config ───────────────────────────────────────────────────────────────
variable "rails_env" {
  description = "RAILS_ENV value"
  type        = string
  default     = "production"
}

variable "frontend_url" {
  description = "Public URL of the frontend (e.g. https://app.bugzera.com)"
  type        = string
  default     = "https://app.bugzera.com"
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_redirect_uri" {
  description = "Google OAuth redirect URI"
  type        = string
  default     = "https://api.bugzera.com/api/v1/google_calendar/callback"
}

variable "domain_name" {
  description = "Base domain (e.g. bugzera.com)"
  type        = string
  default     = "bugzera.com"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (create in us-east-1 for CloudFront, ap-south-1 for ALB)"
  type        = string
  default     = ""
}
