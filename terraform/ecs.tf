# ─── ECS Cluster ──────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.app_name}-cluster" }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"   # Default SPOT — 70% cheaper
    weight            = 4
    base              = 0
  }
}

# ─── Shared config ────────────────────────────────────────────────────────────
locals {
  common_secrets = [
    {
      name      = "SECRET_KEY_BASE"
      valueFrom = "${aws_secretsmanager_secret.app.arn}:SECRET_KEY_BASE::"
    },
    {
      name      = "DATABASE_URL"
      valueFrom = aws_secretsmanager_secret.database_url.arn
    }
  ]

  common_environment = [
    { name = "RAILS_ENV",                value = var.rails_env },
    { name = "RAILS_LOG_TO_STDOUT",      value = "true" },
    { name = "RAILS_SERVE_STATIC_FILES", value = "true" },
    { name = "TZ",                       value = "Asia/Kolkata" },
    { name = "FRONTEND_URL",             value = var.frontend_url },
    # Redis runs as sidecar — use localhost
    { name = "REDIS_URL",                value = "redis://localhost:6379/1" },
    { name = "AWS_REGION",               value = var.aws_region },
    { name = "S3_BUCKET",                value = aws_s3_bucket.uploads.bucket },
    { name = "GOOGLE_REDIRECT_URI",      value = var.google_redirect_uri },
  ]

  google_secrets = [
    {
      name      = "GOOGLE_CLIENT_ID"
      valueFrom = "${aws_secretsmanager_secret.app.arn}:GOOGLE_CLIENT_ID::"
    },
    {
      name      = "GOOGLE_CLIENT_SECRET"
      valueFrom = "${aws_secretsmanager_secret.app.arn}:GOOGLE_CLIENT_SECRET::"
    }
  ]
}

# ═══════════════════════════════════════════════════════════════════════════════
# BACKEND — Rails API  +  Redis sidecar (saves $12/month vs ElastiCache)
# ═══════════════════════════════════════════════════════════════════════════════
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu     # 512
  memory                   = var.backend_memory  # 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    # ── Redis sidecar ─────────────────────────────────────────────────────────
    {
      name      = "redis"
      image     = "redis:7-alpine"
      essential = false   # If redis crashes, don't kill the whole task

      portMappings = [{ containerPort = 6379, protocol = "tcp" }]

      # Persist Redis data in ephemeral storage (wiped on task restart — acceptable for Sidekiq queues)
      command = ["redis-server", "--save", "60", "1", "--loglevel", "warning"]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/${var.app_name}/redis"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
          awslogs-create-group  = "true"
        }
      }

      # Small allocation — Redis barely uses RAM for Sidekiq queues
      resourceRequirements = []
    },

    # ── Rails API ─────────────────────────────────────────────────────────────
    {
      name      = "backend"
      image     = var.backend_image != "" ? var.backend_image : "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true

      portMappings = [{ containerPort = 3000, protocol = "tcp" }]

      command = [
        "sh", "-c",
        # Wait for Redis sidecar, then migrate + start
        "sleep 3 && bundle exec rails db:migrate && bundle exec rails server -b 0.0.0.0 -p 3000"
      ]

      environment = local.common_environment
      secrets     = concat(local.common_secrets, local.google_secrets)

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/v1/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      # Redis must start first
      dependsOn = [{ containerName = "redis", condition = "START" }]
    }
  ])

  tags = { Name = "${var.app_name}-backend-task" }
}

resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count   # 1 by default (cost-optimized)

  # FARGATE_SPOT: 70% cheaper — backend can handle brief interruptions
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 4
    base              = 0
  }

  # Keep 1 on standard FARGATE for stability during spot interruptions
  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3000
  }

  deployment_circuit_breaker { enable = true; rollback = true }
  deployment_controller { type = "ECS" }
  lifecycle { ignore_changes = [desired_count] }
  depends_on = [aws_lb_listener.https]

  tags = { Name = "${var.app_name}-backend-service" }
}

# ═══════════════════════════════════════════════════════════════════════════════
# SIDEKIQ — Background Jobs (FARGATE_SPOT only — 70% cheaper, restartable)
# ═══════════════════════════════════════════════════════════════════════════════
resource "aws_ecs_task_definition" "sidekiq" {
  family                   = "${var.app_name}-sidekiq"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.sidekiq_cpu     # 256
  memory                   = var.sidekiq_memory  # 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "sidekiq"
    image     = var.backend_image != "" ? var.backend_image : "${aws_ecr_repository.backend.repository_url}:latest"
    essential = true
    command   = ["bundle", "exec", "sidekiq"]

    environment = local.common_environment
    secrets     = concat(local.common_secrets, local.google_secrets)

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.sidekiq.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])

  tags = { Name = "${var.app_name}-sidekiq-task" }
}

resource "aws_ecs_service" "sidekiq" {
  name            = "${var.app_name}-sidekiq"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.sidekiq.arn
  desired_count   = 1

  # 100% FARGATE_SPOT — Sidekiq jobs are retryable, spot interruptions are fine
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
    base              = 1
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.sidekiq.id]
    assign_public_ip = false
  }

  deployment_circuit_breaker { enable = true; rollback = true }

  tags = { Name = "${var.app_name}-sidekiq-service" }
}

# ═══════════════════════════════════════════════════════════════════════════════
# FRONTEND — React served via nginx (FARGATE_SPOT)
# ═══════════════════════════════════════════════════════════════════════════════
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.app_name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.frontend_cpu     # 256
  memory                   = var.frontend_memory  # 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = var.frontend_image != "" ? var.frontend_image : "${aws_ecr_repository.frontend.repository_url}:latest"
    essential = true

    portMappings = [{ containerPort = 80, protocol = "tcp" }]

    environment = [{ name = "TZ", value = "Asia/Kolkata" }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.frontend.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:80/healthz || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 20
    }
  }])

  tags = { Name = "${var.app_name}-frontend-task" }
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.app_name}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count   # 1

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
    base              = 1
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.frontend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  deployment_circuit_breaker { enable = true; rollback = true }
  depends_on = [aws_lb_listener.https]

  tags = { Name = "${var.app_name}-frontend-service" }
}

# ─── Auto Scaling (scale up when needed, scale down to save cost) ─────────────
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = 4
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${var.app_name}-backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
