# ─── Rails Secret Key Base ────────────────────────────────────────────────────
resource "random_password" "secret_key_base" {
  length  = 128
  special = false
}

# ─── AWS Secrets Manager — App Secrets ────────────────────────────────────────
resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.app_name}/${var.environment}/app-secrets"
  description             = "BugZera application secrets"
  recovery_window_in_days = 7

  tags = { Name = "${var.app_name}-app-secrets" }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    SECRET_KEY_BASE      = random_password.secret_key_base.result
    DATABASE_PASSWORD    = random_password.db_password.result
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
  })
}

# ─── Database Connection URL (convenience secret for ECS) ─────────────────────
resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${var.app_name}/${var.environment}/database-url"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.postgres.address}:5432/${var.db_name}"
}
