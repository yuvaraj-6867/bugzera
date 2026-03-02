# ElastiCache REMOVED — saves $12/month.
# Redis runs as a sidecar container inside the backend ECS task (see ecs.tf).
# REDIS_URL = redis://localhost:6379/1  (same task, loopback)
#
# To upgrade to managed Redis later:
#   Uncomment below, update ecs.tf REDIS_URL to cluster address, remove redis sidecar.

# resource "aws_elasticache_subnet_group" "main" {
#   name       = "${var.app_name}-redis-subnet-group"
#   subnet_ids = aws_subnet.private[*].id
# }
#
# resource "aws_elasticache_cluster" "redis" {
#   cluster_id           = "${var.app_name}-redis"
#   engine               = "redis"
#   engine_version       = "7.0"
#   node_type            = "cache.t3.micro"
#   num_cache_nodes      = 1
#   parameter_group_name = "default.redis7"
#   port                 = 6379
#   subnet_group_name    = aws_elasticache_subnet_group.main.name
#   security_group_ids   = [aws_security_group.redis.id]
# }
