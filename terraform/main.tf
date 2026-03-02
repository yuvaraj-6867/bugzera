terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Remote state — enable after creating S3 bucket manually once
  # backend "s3" {
  #   bucket = "bugzera-terraform-state"
  #   key    = "prod/terraform.tfstate"
  #   region = "ap-south-1"
  #   encrypt = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "bugzera"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Random suffix to ensure unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}
